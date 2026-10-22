// Demo detection rules (runs in the browser).
// To use the real backend, replace analyse() with a fetch to /api/check.
const BR = [
    "sbi",
    "hdfc",
    "icici",
    "paytm",
    "phonepe",
    "gpay",
    "axis",
    "npci",
    "uidai",
    "irctc",
  ],
  OFF = [
    "sbi.co.in",
    "onlinesbi.sbi",
    "hdfcbank.com",
    "icicibank.com",
    "paytm.com",
    "phonepe.com",
    "axisbank.com",
    "npci.org.in",
    "uidai.gov.in",
    "irctc.co.in",
  ];
const REP = [
  "sbi-kyc-update.xyz",
  "hdfc-verify-kyc.top",
  "icici-kyc-secure.click",
  "refund.support.4471@ybl",
  "care.paytm.help@ybl",
  "gpay-refund-desk@axl",
];
const host = (s) => {
  try {
    return new URL(
      /^https?:/i.test(s) ? s : "http://" + s,
    ).hostname.toLowerCase();
  } catch (e) {
    return "";
  }
};
const kind = (s) =>
  /^[\w.\-]{2,}@[a-z]{2,}$/i.test(s)
    ? "upi"
    : /^\S+@\S+\.\S+$/.test(s)
      ? "email"
      : !/\s/.test(s) && /https?:\/\/|www\.|\.\w{2,}(\/|$)/i.test(s)
        ? "link"
        : "sms";
function sLink(s, r) {
  const h = host(s);
  let p = 0;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) {
    p += 35;
    r.push("ip");
  }
  if (/\.(xyz|top|click|loan|icu|work|live|site|online)$/.test(h)) {
    p += 25;
    r.push("tld");
  }
  if (
    BR.some((b) => h.includes(b)) &&
    !OFF.some((o) => h === o || h.endsWith("." + o))
  ) {
    p += 40;
    r.push("brand");
  }
  if ((h.match(/-/g) || []).length >= 2) {
    p += 12;
    r.push("hyph");
  }
  if (/^http:/i.test(s)) {
    p += 10;
    r.push("http");
  }
  if (/verify|kyc|update|secure|login|reward|claim|refund/i.test(s)) {
    p += 15;
    r.push("kw");
  }
  if (s.includes("@")) {
    p += 20;
    r.push("at");
  }
  return p;
}
async function analyse(s) {
  const r = [],
    t = kind(s);
  let p = 0;
  if (t === "link") p = sLink(s, r);
  else if (t === "sms") {
    if (/urgent|immediately|blocked|suspend|expire|24 hours/i.test(s)) {
      p += 25;
      r.push("urg");
    }
    if (/otp|pin|cvv|password/i.test(s)) {
      p += 35;
      r.push("otp");
    }
    if (/lottery|won|prize|reward|gift/i.test(s)) {
      p += 25;
      r.push("prize");
    }
    if (/kyc|pan|aadhaar/i.test(s)) {
      p += 15;
      r.push("kycm");
    }
    const u = s.match(/(https?:\/\/|www\.)\S+/i);
    if (u) p += Math.round(sLink(u[0], r) * 0.8);
  } else if (t === "upi") {
    if (/refund|support|care|help|lottery|kyc|desk/i.test(s)) {
      p += 45;
      r.push("upikw");
    }
    if (/\d{4,}/.test(s)) {
      p += 15;
      r.push("num");
    }
  } else {
    const b = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(s.toLowerCase()),
      ),
      x = [...new Uint8Array(b)]
        .map((v) => v.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 5);
    if (parseInt(x[0], 16) < 6) {
      p = 72;
      r.push(["breach", x]);
    } else {
      p = 8;
      r.push(["cleanb", x]);
    }
  }
  if (REP.some((e) => s.toLowerCase().includes(e))) {
    p += 40;
    r.push("rep");
  }
  if (!r.length) r.push("clean");
  p = Math.min(97, p);
  if (!p) p = 4;
  return { s, t, p, r, v: p < 30 ? "safe" : p < 60 ? "warn" : "bad" };
}
function gang(o) {
  const s = o.s.toLowerCase();
  return o.t === "upi" || /refund|paytm|phonepe|gpay/.test(s)
    ? "refund"
    : /kyc|sbi|hdfc|icici|axis/.test(s)
      ? "kyc"
      : "other";
}
