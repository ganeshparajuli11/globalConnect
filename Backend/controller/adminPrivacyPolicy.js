const PrivacyPolicy = require("../models/PrivacyPolicy");
const TermsConditions = require("../models/termsConditions");


// Create or update the Privacy Policy document
exports.createOrUpdatePrivacyPolicy = async (req, res) => {
  try {
    const { content, effectiveDate } = req.body;
    let policy = await PrivacyPolicy.findOne();
    if (policy) {
      policy.content = content;
      policy.effectiveDate = effectiveDate || policy.effectiveDate;
      policy.updatedAt = new Date();
      await policy.save();
      return res.json({ message: "Privacy Policy updated successfully", policy });
    } else {
      policy = new PrivacyPolicy({ content, effectiveDate });
      await policy.save();
      return res.json({ message: "Privacy Policy created successfully", policy });
    }
  } catch (err) {
    res.status(500).json({ message: "Error saving privacy policy", error: err.message });
  }
};

// Get the Privacy Policy
exports.getPrivacyPolicy = async (req, res) => {
  try {
    const policy = await PrivacyPolicy.findOne();
    res.json({ policy });
  } catch (err) {
    res.status(500).json({ message: "Error fetching privacy policy", error: err.message });
  }
};

// Delete the Privacy Policy
exports.deletePrivacyPolicy = async (req, res) => {
  try {
    await PrivacyPolicy.deleteMany({});
    res.json({ message: "Privacy Policy deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting privacy policy", error: err.message });
  }
};


exports.createOrUpdateTermsConditions = async (req, res) => {
    try {
      const { content, effectiveDate } = req.body;
      let terms = await TermsConditions.findOne();
      if (terms) {
        // Update the existing document
        terms.content = content || terms.content;
        terms.effectiveDate = effectiveDate || terms.effectiveDate;
        terms.updatedAt = new Date();
        await terms.save();
        return res.json({ message: "Terms & Conditions updated successfully", terms });
      } else {
        // Create a new document
        terms = new TermsConditions({ content, effectiveDate });
        await terms.save();
        return res.json({ message: "Terms & Conditions created successfully", terms });
      }
    } catch (err) {
      res.status(500).json({ message: "Error saving Terms & Conditions", error: err.message });
    }
  };
  
  /**
   * Retrieve the current Terms & Conditions.
   */
  exports.getTermsConditions = async (req, res) => {
    try {
      const terms = await TermsConditions.findOne();
      if (terms) {
        return res.json({ terms });
      } else {
        return res.json({ terms: null, message: "No Terms & Conditions found." });
      }
    } catch (err) {
      res.status(500).json({ message: "Error fetching Terms & Conditions", error: err.message });
    }
  };
  
  /**
   * Delete the Terms & Conditions.
   */
  exports.deleteTermsConditions = async (req, res) => {
    try {
      await TermsConditions.deleteMany({});
      res.json({ message: "Terms & Conditions deleted" });
    } catch (err) {
      res.status(500).json({ message: "Error deleting Terms & Conditions", error: err.message });
    }
  };