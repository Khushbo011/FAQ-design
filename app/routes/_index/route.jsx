import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { login } from "../../shopify.server";
import { useState } from "react";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData();
  const [shop, setShop] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div style={pageStyles}>
      <style dangerouslySetInnerHTML={{ __html: LANDING_STYLES }} />

      {/* Background decoration */}
      <div className="landing-bg-orb landing-bg-orb-1" />
      <div className="landing-bg-orb landing-bg-orb-2" />
      <div className="landing-bg-orb landing-bg-orb-3" />

      <div className="landing-container">
        {/* Logo / Brand */}
        <div className="landing-logo">
          <div className="landing-logo-icon">
            <span>?</span>
          </div>
        </div>

        {/* Hero */}
        <h1 className="landing-heading">
          FAQify <span className="landing-heading-accent">Pro</span>
        </h1>
        <p className="landing-tagline">
          Beautiful, customizable FAQ sections for your Shopify store.
          <br />
          Boost conversions and reduce support tickets instantly.
        </p>

        {/* Login Form */}
        {showForm && (
          <Form method="post" action="/auth/login" className="landing-form">
            <div className={`landing-input-group ${isFocused ? "focused" : ""}`}>
              <label className="landing-label" htmlFor="shop-domain">
                Shop domain
              </label>
              <div className="landing-input-wrapper">
                <input
                  id="shop-domain"
                  className="landing-input"
                  type="text"
                  name="shop"
                  placeholder="your-store"
                  value={shop}
                  onChange={(e) => setShop(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  autoComplete="on"
                />
                <span className="landing-input-suffix">.myshopify.com</span>
              </div>
            </div>
            <button className="landing-btn" type="submit">
              <span>Connect Your Store</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </Form>
        )}

        {/* Feature Pills */}
        <div className="landing-features">
          <div className="landing-feature-pill">
            <span className="pill-icon">🎨</span>
            <div>
              <strong>6 Premium Templates</strong>
              <span>Accordion, Grid, Cards, Dark Mode & more</span>
            </div>
          </div>
          <div className="landing-feature-pill">
            <span className="pill-icon">⚡</span>
            <div>
              <strong>Real-Time Customization</strong>
              <span>Live preview editor with color pickers & typography</span>
            </div>
          </div>
          <div className="landing-feature-pill">
            <span className="pill-icon">📱</span>
            <div>
              <strong>Fully Responsive</strong>
              <span>Looks perfect on every device, automatically</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="landing-footer">
          Trusted by Shopify merchants worldwide
        </p>
      </div>
    </div>
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

const LANDING_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  /* Background orbs */
  .landing-bg-orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(100px);
    opacity: 0.15;
    pointer-events: none;
    z-index: 0;
  }
  .landing-bg-orb-1 {
    width: 500px; height: 500px;
    background: #7c3aed;
    top: -100px; left: -100px;
    animation: orbFloat1 15s ease-in-out infinite;
  }
  .landing-bg-orb-2 {
    width: 400px; height: 400px;
    background: #3b82f6;
    bottom: -80px; right: -80px;
    animation: orbFloat2 18s ease-in-out infinite;
  }
  .landing-bg-orb-3 {
    width: 300px; height: 300px;
    background: #10b981;
    top: 50%; left: 60%;
    animation: orbFloat3 20s ease-in-out infinite;
  }
  @keyframes orbFloat1 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(60px,80px); } }
  @keyframes orbFloat2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-50px,-60px); } }
  @keyframes orbFloat3 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-40px,50px); } }

  /* Container */
  .landing-container {
    position: relative;
    z-index: 1;
    max-width: 520px;
    width: 100%;
    padding: 48px 40px;
    text-align: center;
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 24px;
    box-shadow: 0 32px 64px rgba(0,0,0,0.4);
    margin: 20px;
  }

  /* Logo */
  .landing-logo {
    display: flex;
    justify-content: center;
    margin-bottom: 24px;
  }
  .landing-logo-icon {
    width: 56px; height: 56px;
    background: linear-gradient(135deg, #7c3aed, #3b82f6);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: 800;
    color: #fff;
    box-shadow: 0 8px 24px rgba(124,58,237,0.4);
    animation: logoPulse 3s ease-in-out infinite;
  }
  @keyframes logoPulse {
    0%,100% { box-shadow: 0 8px 24px rgba(124,58,237,0.4); }
    50% { box-shadow: 0 8px 32px rgba(124,58,237,0.6); }
  }

  /* Heading */
  .landing-heading {
    font-size: 36px;
    font-weight: 800;
    color: #fff;
    margin: 0 0 10px;
    letter-spacing: -0.03em;
    line-height: 1.1;
  }
  .landing-heading-accent {
    background: linear-gradient(135deg, #a78bfa, #60a5fa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Tagline */
  .landing-tagline {
    color: rgba(255,255,255,0.55);
    font-size: 15px;
    line-height: 1.6;
    margin: 0 0 32px;
    font-weight: 400;
  }

  /* Form */
  .landing-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 36px;
  }
  .landing-input-group {
    text-align: left;
    transition: all 0.2s ease;
  }
  .landing-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255,255,255,0.5);
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .landing-input-wrapper {
    display: flex;
    align-items: center;
    background: rgba(255,255,255,0.06);
    border: 1.5px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.25s ease;
  }
  .landing-input-group.focused .landing-input-wrapper {
    border-color: #7c3aed;
    box-shadow: 0 0 0 3px rgba(124,58,237,0.15);
    background: rgba(255,255,255,0.08);
  }
  .landing-input {
    flex: 1;
    padding: 14px 16px;
    background: transparent;
    border: none;
    outline: none;
    color: #fff;
    font-size: 15px;
    font-family: inherit;
    font-weight: 500;
  }
  .landing-input::placeholder {
    color: rgba(255,255,255,0.25);
  }
  .landing-input-suffix {
    padding: 14px 16px 14px 0;
    color: rgba(255,255,255,0.3);
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    user-select: none;
  }

  /* Button */
  .landing-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 15px 28px;
    background: linear-gradient(135deg, #7c3aed, #3b82f6);
    color: #fff;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.25s ease;
    box-shadow: 0 4px 16px rgba(124,58,237,0.35);
    letter-spacing: -0.01em;
  }
  .landing-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(124,58,237,0.45);
  }
  .landing-btn:active {
    transform: translateY(0);
  }

  /* Feature Pills */
  .landing-features {
    display: flex;
    flex-direction: column;
    gap: 12px;
    text-align: left;
  }
  .landing-feature-pill {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 14px 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    transition: all 0.2s ease;
  }
  .landing-feature-pill:hover {
    background: rgba(255,255,255,0.07);
    border-color: rgba(255,255,255,0.1);
  }
  .pill-icon {
    font-size: 20px;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .landing-feature-pill strong {
    display: block;
    color: rgba(255,255,255,0.9);
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 2px;
  }
  .landing-feature-pill span {
    color: rgba(255,255,255,0.4);
    font-size: 13px;
    line-height: 1.4;
  }

  /* Footer */
  .landing-footer {
    margin-top: 28px;
    color: rgba(255,255,255,0.2);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  /* Responsive */
  @media (max-width: 560px) {
    .landing-container {
      padding: 36px 24px;
      border-radius: 20px;
    }
    .landing-heading {
      font-size: 28px;
    }
  }
`;
