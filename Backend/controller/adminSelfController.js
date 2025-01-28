
const User = require('../models/userSchema'); 



const getUserDetails = async (req, res) => {
    try {
      // Step 1: Access the user data from req.user (populated by checkAuthentication)
      const user = req.user;
  
      console.log("Decoded user from token: ", user); // Debugging line
  
      // Check if user data exists and if the userId is available
      if (!user || !user.id) {
        return res.status(404).json({ message: "User not found in request data." });
      }
  
      // Step 2: Get the user details from the database using the userId from the token
      const userDetails = await User.findById(user.id); // Assuming userId is part of the decoded token
  
      if (!userDetails) {
        return res.status(404).json({ message: "User not found in database." });
      }
  
      // Step 3: Return the user details in the response
      res.status(200).json({ data: userDetails });
  
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  


module.exports = { getUserDetails };

