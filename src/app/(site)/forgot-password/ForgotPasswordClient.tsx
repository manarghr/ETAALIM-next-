"use client";

// "I forgot my password." We never see or reset the password ourselves — we ask
// Supabase to email a one-time link, and the person chooses a new password on
// /reset-password once that link has signed them in.
import { useState, FormEvent } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { createClient } from "@/lib/supabase/client";
import s from "@/components/AuthForm.module.css";

export default function ForgotPasswordClient() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError(null);

    const supabase = createClient();
    const { error: sendError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        // Straight to the form, NOT through /auth/callback: a recovery link can
        // come back with the session in the URL *hash* (#access_token=…), and a
        // hash never reaches the server — the route handler would see nothing
        // and bounce the user to /login. The page itself handles every shape.
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );
    setSending(false);

    if (sendError) {
      setError(sendError.message);
      return;
    }
    // Always the same confirmation, whether or not the address exists — saying
    // "no such account" would tell a stranger which emails are registered.
    setSent(true);
  };

  return (
    <div className={s.authPage}>
      <div className="container">
        <div className={s.authGrid}>
          <div className={s.illustration}>
            <img src="/images/auth-login.svg" alt="" />
          </div>

          <div className={s.card}>
            <div className={s.head}>
              <h1>{t("forgot.title")}</h1>
              <p>{t("forgot.subtitle")}</p>
            </div>

            {sent && (
              <div className={s.success}>
                <i className="fa fa-envelope-o"></i>
                {t("forgot.sent")}
              </div>
            )}

            {error && (
              <div className={s.alert}>
                <i className="fa fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            {!sent && (
              <form className={s.form} onSubmit={handleSubmit}>
                <div className={s.formGroup}>
                  <label htmlFor="fp-email">{t("auth.emailLabel")}</label>
                  <div className={s.inputWithIcon}>
                    <i className="fa fa-envelope"></i>
                    <input
                      id="fp-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("auth.emailPh")}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className={s.submitBtn} disabled={sending}>
                  {sending ? t("forgot.sending") : t("forgot.submit")}
                </button>
              </form>
            )}

            <p className={s.switch}>
              <Link href="/login">{t("forgot.backToLogin")}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
