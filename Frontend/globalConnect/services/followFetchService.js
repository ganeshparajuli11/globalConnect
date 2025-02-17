import axios from "axios";
import { useCallback, useState, useEffect } from "react";
import config from "../constants/config";
import { userAuth } from "../contexts/AuthContext";

const ip = config.API_IP;
const FOLLOWERS_API_URL = `http://${ip}:3000/api/followers`;
const FOLLOWING_API_URL = `http://${ip}:3000/api/following`;

export const useFetchFollowers = () => {
  const { authToken } = userAuth();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFollowers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(FOLLOWERS_API_URL, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setFollowers(response.data.followers || []);
    } catch (error) {
      console.error("Error fetching followers:", error);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchFollowers();
  }, [fetchFollowers]);

  return { followers, fetchFollowers, loading };
};

export const useFetchFollowing = () => {
  const { authToken } = userAuth();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFollowing = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(FOLLOWING_API_URL, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setFollowing(response.data.following || []);
    } catch (error) {
      console.error("Error fetching following:", error);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  return { following, fetchFollowing, loading };
};
