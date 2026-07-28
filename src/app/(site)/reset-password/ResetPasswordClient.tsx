"use client";

// Choosing a new password. Getting here means the emailed link already signed
// the person in (that link IS the proof of identity), so we only have to write
// the new password — Supabase hashes it; we never see the old one.
import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { createClient } from "@/lib/supabase/client";
import s from "@/components/AuthForm.module.css";

export default function ResetPasswordClient() {
  const { t } = useI18n();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // null = still checking whether the link gave us a session
  const [valid, setValid] = useState<boolean | null>(null);

  const toggle = (id: string) => setShow((v) => ({ ...v, [id]: !v[id] }));
  const groupClass = (field: string) =>
    `${s.formGroup} ${errors[field] ? s.formGroupError : ""}`;

  // Work out whether the emailed link actually signed us in. Recovery links
  // arrive in more than one shape, so we handle all of them:
  //   • ?code=…        → /auth/callback already exchanged it; we just have a session.
  //   • ?token_hash=…  → not exchanged yet; verifyOtp() does it here.
  //   • #access_token= → the browser client picks it up, but asynchronously,
  //                      so we wait for onAuthStateChange rather than deciding
  //                      on the first getUser() (which would say "expired").
  //   • ?error=/#error= → expired or already-used link.
  useEffect(() => {
    const supabase = createClient();
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const settle = (ok: boolean) => {
      if (!settled) {
        settled = true;
        setValid(ok);
      }
    };
    // Never leave a one-time token sitting in the address bar or the history.
    const cleanUrl = () =>
      window.history.replaceState({}, "", window.location.pathname);

    // Whichever shape the link takes, a session appearing is the success signal
    // — so listen for it first and let the branches below just trigger it.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) settle(true);
    });

    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

    if (query.get("error") || hash.get("error")) {
      // Expired, already used, or refused.
      cleanUrl();
      settle(false);
    } else {
      const tokenHash = query.get("token_hash");
      const code = query.get("code");
      if (tokenHash) {
        // ?token_hash=…&type=recovery — verify it ourselves.
        supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
      } else if (code) {
        // ?code=… — the browser client may already be exchanging this one
        // itself; a duplicate attempt is harmless, we only act on the session.
        supabase.auth.exchangeCodeForSession(code);
      }
      // #access_token=… needs nothing: the browser client reads the hash.
      if (tokenHash || code) cleanUrl();

      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) settle(true);
      });
      // Every path above is asynchronous, so give them a moment before
      // declaring the link dead.
      timer = setTimeout(() => settle(false), 2500);
    }

    return () => {
      if (timer) clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next: Record<string, boolean> = {};
    if (password.length < 8) next.password = true;
    if (password !== confirm) next.confirm = true;
    setErrors(next);
    setError(null);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    // Sign out so they log back in with the new password — which also proves to
    // them that it took.
    await supabase.auth.signOut();
    router.push("/login?reset=1");
  };

  if (valid === null) return null;

  return (
    <div className={s.authPage}>
      <div className="container">
        <div className={s.authGrid}>
          <div className={s.illustration}>
            <img src="/images/auth-login.svg" alt="" />
          </div>

          <div className={s.card}>
            <div className={s.head}>
              <h1>{t("reset.title")}</h1>
              <p>{valid ? t("reset.subtitle") : t("reset.expired")}</p>
            </div>

            {error && (
              <div className={s.alert}>
                <i className="fa fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            {valid ? (
              <form className={s.form} onSubmit={handleSubmit} noValidate>
                <div className={groupClass("password")}>
                  <label htmlFor="rp-password">{t("reset.newPassword")}</label>
                  <div className={`${s.inputWithIcon} ${s.passwordField}`}>
                    <i className="fa fa-lock"></i>
                    <input
                      id="rp-password"
                      type={show.a ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("auth.createPasswordPh")}
                    />
                    <button
                      type="button"
                      className={s.togglePassword}
                      onClick={() => toggle("a")}
                      aria-label="Toggle password"
                    >
                      <i className={`fa ${show.a ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
                  </div>
                  <div className={s.errorMessage}>{t("auth.errPassword")}</div>
                </div>

                <div className={groupClass("confirm")}>
                  <label htmlFor="rp-confirm">{t("auth.confirmPassword")}</label>
                  <div className={`${s.inputWithIcon} ${s.passwordField}`}>
                    <i className="fa fa-lock"></i>
                    <input
                      id="rp-confirm"
                      type={show.b ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder={t("auth.confirmPh")}
                    />
                    <button
                      type="button"
                      className={s.togglePassword}
                      onClick={() => toggle("b")}
                      aria-label="Toggle password"
                    >
                      <i className={`fa ${show.b ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
                  </div>
                  <div className={s.errorMessage}>{t("auth.errConfirm")}</div>
                </div>

                <button type="submit" className={s.submitBtn} disabled={saving}>
                  {saving ? t("reset.saving") : t("reset.submit")}
                </button>
              </form>
            ) : (
              <p className={s.switch}>
                <Link href="/forgot-password">{t("reset.requestAgain")}</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
