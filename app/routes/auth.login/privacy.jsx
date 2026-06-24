export const loader = () => {
    return null;
}

export default function PrivacyPolicy() {
    return (
        <div style={{ backgroundColor: "#ffffff", color: "#000000", minHeight: "100vh", padding: "40px" }}>
            <div style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: "800px", margin: "0 auto", lineHeight: "1.6", backgroundColor: "#ffffff", color: "#000000", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem", color: "#000000" }}>Privacy Policy</h1>
                <p style={{ color: "#444444", marginBottom: "2rem" }}>Last updated: {new Date().toLocaleDateString()}</p>

                <h2 style={{ fontSize: "1.5rem", marginTop: "1.5rem", marginBottom: "0.5rem", color: "#000000" }}>Introduction</h2>
                <p style={{ marginBottom: "1rem", color: "#111111" }}>Welcome to our Privacy Policy. This policy describes how our Shopify application ("the App") collects, uses, and shares your personal information when you use it.</p>

                <h2 style={{ fontSize: "1.5rem", marginTop: "1.5rem", marginBottom: "0.5rem", color: "#000000" }}>Information the App Collects</h2>
                <p style={{ marginBottom: "0.5rem", color: "#111111" }}>When you install the App, we are automatically able to access certain types of information from your Shopify account:</p>
                <ul style={{ paddingLeft: "2rem", marginBottom: "1rem", color: "#111111" }}>
                    <li style={{ marginBottom: "0.25rem" }}>Store information (e.g., store name, email address)</li>
                    <li style={{ marginBottom: "0.25rem" }}>Customer information (if applicable to the app's functionality)</li>
                </ul>

                <h2 style={{ fontSize: "1.5rem", marginTop: "1.5rem", marginBottom: "0.5rem", color: "#000000" }}>How Do We Use Your Personal Information?</h2>
                <p style={{ marginBottom: "1rem", color: "#111111" }}>We use the personal information we collect from you and your customers in order to provide the Service and to operate the App securely and efficiently.</p>

                <h2 style={{ fontSize: "1.5rem", marginTop: "1.5rem", marginBottom: "0.5rem", color: "#000000" }}>Data Retention</h2>
                <p style={{ marginBottom: "1rem", color: "#111111" }}>When you use our App, we will maintain your Order Information for our records unless and until you ask us to delete this information.</p>

                <h2 style={{ fontSize: "1.5rem", marginTop: "1.5rem", marginBottom: "0.5rem", color: "#000000" }}>Changes</h2>
                <p style={{ marginBottom: "1rem", color: "#111111" }}>We may update this privacy policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal or regulatory reasons.</p>

                <h2 style={{ fontSize: "1.5rem", marginTop: "1.5rem", marginBottom: "0.5rem", color: "#000000" }}>Contact Us</h2>
                <p style={{ marginBottom: "1rem", color: "#111111" }}>For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by email at our support address.</p>
            </div>
        </div>
    );
}
