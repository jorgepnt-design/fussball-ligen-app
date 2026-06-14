// Web-Push (RFC 8291 aes128gcm + RFC 8292 VAPID) mit WebCrypto.
// Läuft im Cloudflare-Worker und in Node (>=20, globales crypto.subtle).
// Verschlüsselung ist gegen den RFC-8291-Testvektor verifiziert (push/test-webpush.mjs).

export const b64urlToBytes = (s) => {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

export const bytesToB64url = (bytes) => {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const concat = (...arrs) => {
  const out = new Uint8Array(arrs.reduce((n, a) => n + a.length, 0));
  let o = 0;
  for (const a of arrs) {
    out.set(a, o);
    o += a.length;
  }
  return out;
};

const hkdf = async (salt, ikm, info, length) => {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, length * 8);
  return new Uint8Array(bits);
};

const enc = new TextEncoder();

// ECDH-Privatschlüssel aus rohem Public (65 B, 0x04||x||y) + d (base64url) importieren.
export const importEcdhPrivate = (pubRaw, privB64) =>
  crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", x: bytesToB64url(pubRaw.slice(1, 33)), y: bytesToB64url(pubRaw.slice(33, 65)), d: privB64, ext: true },
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveBits"],
  );

const importEcdsaPrivate = (pubRaw, privB64) =>
  crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", x: bytesToB64url(pubRaw.slice(1, 33)), y: bytesToB64url(pubRaw.slice(33, 65)), d: privB64, ext: true },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

// RFC 8291: verschlüsselt den Payload für ein Push-Abo (p256dh + auth aus der Subscription).
// `inject` erlaubt feste salt/serverKeys für den Testvektor.
export async function encryptContent(plaintext, p256dhB64, authB64, inject) {
  const clientPub = b64urlToBytes(p256dhB64);
  const authSecret = b64urlToBytes(authB64);
  const salt = inject?.salt ?? crypto.getRandomValues(new Uint8Array(16));

  let serverPriv;
  let serverPubRaw;
  if (inject?.serverPrivateKey && inject?.serverPublicRaw) {
    serverPriv = inject.serverPrivateKey;
    serverPubRaw = inject.serverPublicRaw;
  } else {
    const kp = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
    serverPriv = kp.privateKey;
    serverPubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey));
  }

  const clientPubKey = await crypto.subtle.importKey("raw", clientPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: clientPubKey }, serverPriv, 256));

  const ikm = await hkdf(authSecret, ecdh, concat(enc.encode("WebPush: info\0"), clientPub, serverPubRaw), 32);
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);

  const pt = typeof plaintext === "string" ? enc.encode(plaintext) : plaintext;
  const record = concat(pt, new Uint8Array([2])); // einziger Record → Delimiter 0x02
  const cekKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce, tagLength: 128 }, cekKey, record));

  // aes128gcm-Header (RFC 8188): salt(16) | rs(4=4096) | idlen(1) | keyid(serverPub) | ciphertext
  return concat(salt, new Uint8Array([0, 0, 0x10, 0x00]), new Uint8Array([serverPubRaw.length]), serverPubRaw, ciphertext);
}

// RFC 8292: VAPID-Authorization-Header für den Push-Endpunkt.
export async function vapidHeader(endpoint, vapidPublicB64, vapidPrivateB64, subject) {
  const u = new URL(endpoint);
  const part = (o) => bytesToB64url(enc.encode(JSON.stringify(o)));
  const signingInput = `${part({ typ: "JWT", alg: "ES256" })}.${part({ aud: `${u.protocol}//${u.host}`, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject })}`;
  const key = await importEcdsaPrivate(b64urlToBytes(vapidPublicB64), vapidPrivateB64);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(signingInput)));
  return `vapid t=${signingInput}.${bytesToB64url(sig)},k=${vapidPublicB64}`;
}

// Verschlüsselt + signiert + sendet eine Push-Nachricht. Gibt die fetch-Response zurück.
export async function sendPush(subscription, payloadObj, env) {
  const body = await encryptContent(JSON.stringify(payloadObj), subscription.keys.p256dh, subscription.keys.auth);
  const authorization = await vapidHeader(subscription.endpoint, env.VAPID_PUBLIC, env.VAPID_PRIVATE, env.VAPID_SUBJECT || "mailto:jorgepnt@gmail.com");
  return fetch(subscription.endpoint, {
    method: "POST",
    headers: { Authorization: authorization, "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", TTL: "120", Urgency: "high" },
    body,
  });
}
