export const TEMPLATES = [
  {
    id: "classic",
    name: "Classic Accordion",
    tier: "free",
    previewImage: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png", // placeholder
    description: "A standard, clean accordion FAQ layout.",
    defaultSettings: {
      primaryColor: "#000000",
      backgroundColor: "#ffffff",
      textColor: "#333333",
      borderRadius: "4px",
    }
  },
  {
    id: "grid",
    name: "Minimalist Grid",
    tier: "starter",
    previewImage: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png",
    description: "Display FAQs in a neat 2-column grid.",
    defaultSettings: {
      primaryColor: "#008060",
      backgroundColor: "#f4f6f8",
      textColor: "#202223",
      borderRadius: "8px",
    }
  },
  {
    id: "card",
    name: "Modern Card",
    tier: "starter",
    previewImage: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png",
    description: "Each FAQ gets its own elevated card.",
    defaultSettings: {
      primaryColor: "#2c6ecb",
      backgroundColor: "#ffffff",
      textColor: "#202223",
      borderRadius: "12px",
    }
  },
  {
    id: "split",
    name: "Split Layout",
    tier: "starter",
    previewImage: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png",
    description: "Categories on the left, FAQs on the right.",
    defaultSettings: {
      primaryColor: "#000000",
      backgroundColor: "#ffffff",
      textColor: "#333333",
      borderRadius: "0px",
    }
  },
  {
    id: "dark",
    name: "Dark Mode Premium",
    tier: "pro",
    previewImage: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png",
    description: "A sleek, dark-themed accordion for modern stores.",
    defaultSettings: {
      primaryColor: "#ffffff",
      backgroundColor: "#111213",
      textColor: "#e3e5e7",
      borderRadius: "8px",
    }
  },
  {
    id: "masonry",
    name: "Masonry Layout",
    tier: "pro",
    previewImage: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png",
    description: "A Pinterest-style staggered grid of FAQs.",
    defaultSettings: {
      primaryColor: "#008060",
      backgroundColor: "#ffffff",
      textColor: "#202223",
      borderRadius: "16px",
    }
  }
];

export const getTemplateById = (id) => TEMPLATES.find(t => t.id === id) || TEMPLATES[0];
