import { useState } from "react";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import {
  AppProvider as PolarisAppProvider,
} from "@shopify/polaris";
import polarisTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));

  return { errors, polarisTranslations };
};

export const action = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));

  return {
    errors,
  };
};

export default function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [shop, setShop] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const { errors } = actionData || loaderData;

  return (
    <PolarisAppProvider i18n={loaderData.polarisTranslations}>
      <div style={pageStyles}>
        <style dangerouslySetInnerHTML={{ __html: LOGIN_STYLES }} />

        {/* Background decoration */}
        <div className="login-bg-orb login-bg-orb-1" />
        <div className="login-bg-orb login-bg-orb-2" />

        <div className="login-container">
          {/* Logo */}
          <div className="login-logo">
            <div className="login-logo-icon">?</div>
          </div>

          <h1 className="login-heading">Welcome Back</h1>
          <p className="login-subtext">
            Enter your Shopify store domain to continue to FAQify Pro.
          </p>

          <Form method="post" className="login-form">
            <div className={`login-input-group ${isFocused ? "focused" : ""} ${errors.shop ? "has-error" : ""}`}>
              <label className="login-label" htmlFor="shop">Shop domain</label>
              <div className="login-input-wrapper">
                <input
                  id="shop"
                  className="login-input"
                  type="text"
                  name="shop"
                  placeholder="your-store"
                  value={shop}
                  onChange={(e) => setShop(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  autoComplete="on"
                />
                <span className="login-suffix">.myshopify.com</span>
              </div>
              {errors.shop && (
                <p className="login-error">{errors.shop}</p>
              )}
            </div>

            <button className="login-btn" type="submit">
              <span>Log in</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </Form>

          <p className="login-footer">
            Secure authentication powered by Shopify
          </p>
        </div>
      </div>
    </PolarisAppProvider>
  );
}

const pageStyles = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #0f0c29 0%, #1a1a3e 40%, #24243e 100%)",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  overflow: "hidden",
  position: "relative",
};

const LOGIN_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .login-bg-orb {
    position: fixed; border-radius: 50%; filter: blur(100px); opacity: 0.12; pointer-events: none; z-index: 0;
  }
  .login-bg-orb-1 { width: 450px; height: 450px; background: #7c3aed; top: -80px; right: -80px; animation: loginOrb1 16s ease-in-out infinite; }
  .login-bg-orb-2 { width: 350px; height: 350px; background: #3b82f6; bottom: -60px; left: -60px; animation: loginOrb2 20s ease-in-out infinite; }
  @keyframes loginOrb1 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-40px,60px); } }
  @keyframes loginOrb2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(40px,-40px); } }

  .login-container {
    position: relative; z-index: 1;
    max-width: 440px; width: 100%;
    padding: 48px 40px;
    text-align: center;
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 24px;
    box-shadow: 0 32px 64px rgba(0,0,0,0.4);
    margin: 20px;
  }

  .login-logo { display: flex; justify-content: center; margin-bottom: 24px; }
  .login-logo-icon {
    width: 52px; height: 52px;
    background: linear-gradient(135deg, #7c3aed, #3b82f6);
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 26px; font-weight: 800; color: #fff;
    box-shadow: 0 8px 24px rgba(124,58,237,0.4);
  }

  .login-heading {
    font-size: 28px; font-weight: 800; color: #fff;
    margin: 0 0 8px; letter-spacing: -0.03em;
  }
  .login-subtext {
    color: rgba(255,255,255,0.45); font-size: 14px;
    line-height: 1.5; margin: 0 0 32px;
  }

  .login-form { display: flex; flex-direction: column; gap: 18px; margin-bottom: 28px; }

  .login-input-group { text-align: left; }
  .login-label {
    display: block; font-size: 12px; font-weight: 600;
    color: rgba(255,255,255,0.45); margin-bottom: 8px;
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .login-input-wrapper {
    display: flex; align-items: center;
    background: rgba(255,255,255,0.06);
    border: 1.5px solid rgba(255,255,255,0.1);
    border-radius: 12px; overflow: hidden;
    transition: all 0.25s ease;
  }
  .login-input-group.focused .login-input-wrapper {
    border-color: #7c3aed;
    box-shadow: 0 0 0 3px rgba(124,58,237,0.15);
    background: rgba(255,255,255,0.08);
  }
  .login-input-group.has-error .login-input-wrapper {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239,68,68,0.15);
  }
  .login-input {
    flex: 1; padding: 14px 16px;
    background: transparent; border: none; outline: none;
    color: #fff; font-size: 15px; font-family: inherit; font-weight: 500;
  }
  .login-input::placeholder { color: rgba(255,255,255,0.2); }
  .login-suffix {
    padding: 14px 16px 14px 0;
    color: rgba(255,255,255,0.25); font-size: 14px; font-weight: 500;
    white-space: nowrap; user-select: none;
  }
  .login-error {
    margin: 8px 0 0; font-size: 13px; color: #f87171; font-weight: 500;
  }

  .login-btn {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    padding: 15px 28px;
    background: linear-gradient(135deg, #7c3aed, #3b82f6);
    color: #fff; border: none; border-radius: 12px;
    font-size: 16px; font-weight: 600; font-family: inherit;
    cursor: pointer; transition: all 0.25s ease;
    box-shadow: 0 4px 16px rgba(124,58,237,0.35);
  }
  .login-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(124,58,237,0.45);
  }
  .login-btn:active { transform: translateY(0); }

  .login-footer {
    color: rgba(255,255,255,0.18); font-size: 12px;
    font-weight: 500; letter-spacing: 0.03em;
  }

  @media (max-width: 500px) {
    .login-container { padding: 36px 24px; border-radius: 20px; }
    .login-heading { font-size: 24px; }
  }
`;
