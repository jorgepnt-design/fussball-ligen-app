// Verifiziert die Web-Push-Verschlüsselung gegen den offiziellen RFC-8291-Testvektor (Appendix A).
// Lauf:  node push/test-webpush.mjs
import { encryptContent, vapidHeader, importEcdhPrivate, b64urlToBytes, bytesToB64url } from "./src/webpush.js";

// --- RFC 8291 Appendix A ---
const plaintext = b64urlToBytes("V2hlbiBJIGdyb3cgdXAsIEkgd2FudCB0byBiZSBhIHdhdGVybWVsb24"); // "When I grow up, I want to be a watermelon"
const auth = "BTBZMqHH6r4Tts7J_aSIgg";
const uaPublic = "BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4";
const asPublic = "BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8";
const asPrivate = "yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw";
const salt = b64urlToBytes("DGv6ra1nlYgDCS1FRnbzlw");
const expected =
  "DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN";

const serverPubRaw = b64urlToBytes(asPublic);
const serverPrivateKey = await importEcdhPrivate(serverPubRaw, asPrivate);

const body = await encryptContent(plaintext, uaPublic, auth, { salt, serverPrivateKey, serverPublicRaw: serverPubRaw });
const got = bytesToB64url(body);

console.log("erwartet :", expected);
console.log("erhalten :", got);
console.log("AES128GCM:", got === expected ? "✅ PASS (RFC-8291-Testvektor stimmt byte-genau)" : "❌ FAIL");

// VAPID: JWT erzeugen und mit dem öffentlichen Schlüssel verifizieren.
// (öffentliche RFC-8291-Beispielschlüssel – KEIN echtes Secret im Repo.)
const vapidPublic = asPublic;
const vapidPrivate = asPrivate;
const auth1 = await vapidHeader("https://fcm.googleapis.com/fcm/send/abc", vapidPublic, vapidPrivate, "mailto:test@example.com");
const jwt = auth1.match(/t=([^,]+)/)[1];
const [h, p, s] = jwt.split(".");
const pubRaw = b64urlToBytes(vapidPublic);
const verifyKey = await crypto.subtle.importKey(
  "jwk",
  { kty: "EC", crv: "P-256", x: bytesToB64url(pubRaw.slice(1, 33)), y: bytesToB64url(pubRaw.slice(33, 65)), ext: true },
  { name: "ECDSA", namedCurve: "P-256" },
  false,
  ["verify"],
);
const ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, verifyKey, b64urlToBytes(s), new TextEncoder().encode(`${h}.${p}`));
console.log("VAPID JWT:", ok ? "✅ PASS (Signatur verifiziert)" : "❌ FAIL");

process.exit(got === expected && ok ? 0 : 1);
