/**
 * App.js
 
 * This is the main component of the Uplyft Book Chatbot web application.
 * It integrates core functionalities such as user authentication, chatbot interaction,
 * product search and filtering (books), shopping cart operations, and order history display.
 
 * The chatbot parses natural language queries from users to assist with book discovery,
 * apply filters (like genre and price), and perform e-commerce actions (like add to cart or checkout).
 * It supports intelligent conversation flow and uses contextual message tracking to respond appropriately.
 
 * This file also handles route-based navigation (React Router), user session management,
 * and interacts with backend APIs for data persistence and retrieval (e.g., messages, cart, orders).
 
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";
import LoginRegister from "./components/LoginRegister";
import ChatWindow from "./components/ChatWindow";
import MessageInput from "./components/MessageInput";
import ProductFilter from "./components/ProductFilter";
import CartDisplay from "./components/CartDisplay";
import OrderHistory from "./components/OrderHistory";
import * as api from "./services/api";

const parsePriceFiltersFromText = (text) => {
  let minPrice = "";
  let maxPrice = "";
  let remainingText = text.toLowerCase();

  const betweenRegex =
    /(?:between|from)\s*(\d+(?:\.\d+)?)\s*(?:and|to)\s*(\d+(?:\.\d+)?)\s*(?:dollars|rs|eur|€|\$)?/i;
  let match = remainingText.match(betweenRegex);
  if (match) {
    minPrice = Math.min(parseFloat(match[1]), parseFloat(match[2])).toString();
    maxPrice = Math.max(parseFloat(match[1]), parseFloat(match[2])).toString();
    remainingText = remainingText.replace(match[0], "").trim();
  } else {
    const underRegex =
      /(?:under|less than|below)\s*(\d+(?:\.\d+)?)\s*(?:dollars|rs|eur|€|\$)?/i;
    match = remainingText.match(underRegex);
    if (match) {
      maxPrice = parseFloat(match[1]).toString();
      remainingText = remainingText.replace(match[0], "").trim();
    }

    const overRegex =
      /(?:over|more than|above)\s*(\d+(?:\.\d+)?)\s*(?:dollars|rs|eur|€|\$)?/i;
    match = remainingText.match(overRegex);
    if (match) {
      minPrice = parseFloat(match[1]).toString();
      remainingText = remainingText.replace(match[0], "").trim();
    }
  }

  return { minPrice, maxPrice, cleanedText: remainingText };
};

const extractSearchQueryKeywords = (sentence, wordsToRemove = []) => {
  const stopwords = new Set([
    "i",
    "me",
    "my",
    "myself",
    "we",
    "our",
    "ours",
    "ourselves",
    "you",
    "your",
    "yours",
    "yourself",
    "yourselves",
    "he",
    "him",
    "his",
    "himself",
    "she",
    "her",
    "hers",
    "herself",
    "it",
    "its",
    "itself",
    "they",
    "them",
    "their",
    "theirs",
    "themselves",
    "what",
    "which",
    "who",
    "whom",
    "this",
    "that",
    "these",
    "those",
    "am",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "behaving",
    "have",
    "has",
    "had",
    "having",
    "do",
    "does",
    "did",
    "doing",
    "a",
    "an",
    "the",
    "and",
    "but",
    "if",
    "or",
    "because",
    "as",
    "until",
    "while",
    "of",
    "at",
    "by",
    "for",
    "with",
    "about",
    "against",
    "between",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "to",
    "from",
    "up",
    "down",
    "in",
    "out",
    "on",
    "off",
    "over",
    "under",
    "again",
    "further",
    "then",
    "once",
    "here",
    "there",
    "when",
    "where",
    "why",
    "how",
    "all",
    "any",
    "both",
    "each",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "nor",
    "not",
    "only",
    "own",
    "same",
    "so",
    "than",
    "too",
    "very",
    "s",
    "t",
    "can",
    "will",
    "just",
    "don",
    "should",
    "now",
    "book",
    "books",
    "title",
    "author",
    "description",
    "price",
    "cost",
    "value",
    "dollars",
    "dollar",
    "rupees",
    "rupee",
    "euro",
    "euros",
    "eur",
    "rs",
    "genre",
    "genres",
    "about",
    "looking",
    "quantity",
    "item",
    "items",
    "product",
    "products",
    "cart",
    "checkout",
    "place",
    "my",
    "order",
    "buy",
    "now",
    "confirm",
    "finish",
    "yes",
    "no",
    "remove",
    "delete",
    "update",
    "change",
    "set",
    "view",
    "show",
    "list",
    "display",
    "find",
    "i",
    "want",
    "just",
  ]);

  const fullResetPhrases = new Set([
    "reset",
    "clear filters",
    "forget about that",
    "never mind",
  ]);

  let isFullResetIntent = false;
  let processedSentence = sentence.toLowerCase();

  for (const phrase of fullResetPhrases) {
    if (processedSentence.includes(phrase)) {
      isFullResetIntent = true;
      processedSentence = "";
      break;
    }
  }

  processedSentence = processedSentence.replace(/[$£€]/g, "");

  wordsToRemove.forEach((word) => stopwords.add(word.toLowerCase()));

  const keywords = processedSentence
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopwords.has(word))
    .join(" ");

  return { keywords, isFullResetIntent };
};

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [authToken, setAuthToken] = useState(null);
  const [showInitialWelcome, setShowInitialWelcome] = useState(true);

  const lastBotMessageRef = useRef(null);

  const [filters, setFilters] = useState({
    genre: "",
    minPrice: "",
    maxPrice: "",
  });

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const [cartItems, setCartItems] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });

  const navigate = useNavigate();

  const showMessage = useCallback((text, type) => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage({ text: "", type: "" });
    }, 3000);
  }, []);

  const formatDisplayTimestamp = useCallback((isoTimestamp) => {
    try {
      const dateObj = new Date(isoTimestamp);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    } catch (e) {
      console.error("Error formatting timestamp:", isoTimestamp, e);
    }
    return "Invalid Date";
  }, []);

  const logAndSetMessage = useCallback(
    async (msgData) => {
      const originalTimestamp = msgData.timestamp;
      const displayTimestamp = formatDisplayTimestamp(originalTimestamp);

      const messageForState = { ...msgData, timestamp: displayTimestamp };

      setMessages((prevMessages) => [...prevMessages, messageForState]);

      if (msgData.sender === "bot" && msgData.awaitingConfirmation) {
        lastBotMessageRef.current = messageForState;
      } else if (msgData.sender === "bot") {
        lastBotMessageRef.current = messageForState;
      }

      if (msgData.text && isLoggedIn) {
        try {
          await api.saveMessage(
            msgData.sender,
            msgData.text,
            originalTimestamp
          );
        } catch (error) {
          console.error("Error saving message to backend:", error);
        }
      }
    },
    [isLoggedIn, formatDisplayTimestamp]
  );

  const handleLogout = useCallback(async () => {
    try {
      if (authToken) {
        await api.logoutUser();
      }
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      setIsLoggedIn(false);
      setUsername("");
      setAuthToken(null);
      localStorage.removeItem("authToken");
      localStorage.removeItem("username");
      setCartItems([]);
      const logoutMessage = {
        sender: "bot",
        text: "🚪 You have been logged out. Please log in to continue. 🔑",
        timestamp: formatDisplayTimestamp(new Date().toISOString()),
      };
      setMessages([logoutMessage]);
      lastBotMessageRef.current = logoutMessage;
      showMessage("You have been logged out.", "info");
      navigate("/");
    }
  }, [authToken, showMessage, navigate, formatDisplayTimestamp]);

  const fetchUserCart = useCallback(async () => {
    if (!authToken) {
      setCartItems([]);
      return;
    }
    try {
      const items = await api.fetchCartItems();
      setCartItems(items || []);
    } catch (error) {
      console.error("Error fetching cart items:", error);
      if (error.response && error.response.status === 401) {
        showMessage("Your session has expired. Please log in again.", "error");
        handleLogout();
      } else {
      }
    }
  }, [authToken, showMessage, handleLogout]);

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUsername = localStorage.getItem("username");

    const initializeChat = async () => {
      if (storedToken && storedUsername) {
        setIsLoggedIn(true);
        setUsername(storedUsername);
        setAuthToken(storedToken);
        fetchUserCart();

        try {
          const pastMessages = await api.fetchMessages();
          const formattedMessages = pastMessages.map((msg) => ({
            ...msg,
            timestamp: formatDisplayTimestamp(msg.timestamp),
          }));

          if (formattedMessages.length > 0) {
            setMessages(formattedMessages);
            const lastBotMsg = formattedMessages.findLast(
              (msg) => msg.sender === "bot"
            );
            if (lastBotMsg) {
              lastBotMessageRef.current = lastBotMsg;
            }
          } else {
            const welcomeMessage = {
              sender: "bot",
              text: `Hey there, ${storedUsername}! 👋 Ready to find your next great read? Which book are you looking for? 📖`,
              timestamp: formatDisplayTimestamp(new Date().toISOString()),
            };
            setMessages([welcomeMessage]);
            lastBotMessageRef.current = welcomeMessage;
          }
        } catch (error) {
          console.error("Error fetching past messages:", error);
          const errorMessage = {
            sender: "bot",
            text: `Hey there, ${storedUsername}! 👋 We had a little hiccup fetching your past messages ⚠️, but no worries! 😊 Ready to find your next great read? 📚✨ What book are you looking for? 🔍📖`,
            timestamp: formatDisplayTimestamp(new Date().toISOString()),
          };
          setMessages([errorMessage]);
          lastBotMessageRef.current = errorMessage;
          if (error.response && error.response.status === 401) handleLogout();
        }
      } else {
        if (showInitialWelcome) {
          const loginPromptMessage = {
            sender: "bot",
            text: "👋 Please log in or register to start chatting with me! 💬",
            timestamp: formatDisplayTimestamp(new Date().toISOString()),
          };
          setMessages([loginPromptMessage]);
          lastBotMessageRef.current = loginPromptMessage;
        }
      }
      setShowInitialWelcome(false);
    };

    initializeChat();
  }, [showInitialWelcome, fetchUserCart, handleLogout, formatDisplayTimestamp]);

  const handleAddToCart = useCallback(
    async (productId, quantity) => {
      if (!authToken) {
        showMessage("Please log in to add items to your cart.", "warning");
        return;
      }
      try {
        const response = await api.addToCart(productId, quantity);
        showMessage(response.message, "success");
        fetchUserCart();
      } catch (error) {
        console.error("Error adding to cart:", error);
        const errorMessage =
          error.response?.data?.message || "Failed to add to cart.";
        showMessage(errorMessage, "error");
        if (error.response && error.response.status === 401) handleLogout();
      }
    },
    [authToken, showMessage, fetchUserCart, handleLogout]
  );

  const handleLoginSuccess = async (token, user) => {
    setIsLoggedIn(true);
    setUsername(user);
    setAuthToken(token);
    localStorage.setItem("authToken", token);
    localStorage.setItem("username", user);

    try {
      const pastMessages = await api.fetchMessages();
      const formattedMessages = pastMessages.map((msg) => ({
        ...msg,
        timestamp: formatDisplayTimestamp(msg.timestamp),
      }));

      if (formattedMessages.length > 0) {
        setMessages(formattedMessages);
        const lastBotMsg = formattedMessages.findLast(
          (msg) => msg.sender === "bot"
        );
        if (lastBotMsg) {
          lastBotMessageRef.current = lastBotMsg;
        }
      } else {
        const welcomeMessage = {
          sender: "bot",
          text: `📚 Welcome, ${user}! 😊 How can I help you find books today? 🔍`,
          timestamp: formatDisplayTimestamp(new Date().toISOString()),
        };
        setMessages([welcomeMessage]);
        lastBotMessageRef.current = welcomeMessage;
      }
    } catch (error) {
      console.error("Error fetching past messages on login:", error);
      const welcomeMessage = {
        sender: "bot",
        text: `Welcome, ${user}! Had trouble loading past chats. How can I help you find books today?`,
        timestamp: formatDisplayTimestamp(new Date().toISOString()),
      };
      setMessages([welcomeMessage]);
      lastBotMessageRef.current = welcomeMessage;
      if (error.response && error.response.status === 401) handleLogout();
    }
    navigate("/");
  };

  const handleSendMessage = async (
    text,
    currentAuthToken,
    currentFilters = filters
  ) => {
    const userMessage = {
      sender: "user",
      text: text,
      timestamp: new Date().toISOString(),
    };
    await logAndSetMessage(userMessage);

    const greetingRegex =
      /^(hello|hi|hey|how are you|whats up|good morning|good afternoon|good evening)\b/i;

    if (greetingRegex.test(text)) {
      let botResponse = "";
      const lowerText = text.toLowerCase();

      if (
        lowerText.includes("hello") ||
        lowerText.includes("hi") ||
        lowerText.includes("hey")
      ) {
        botResponse = "👋 Hello there! How can I assist you today? 😊";
      } else if (
        lowerText.includes("how are you") ||
        lowerText.includes("whats up")
      ) {
        botResponse =
          "🤖 I'm just a bot, but I'm doing great! How can I help you? 🚀";
      } else if (lowerText.includes("good morning")) {
        botResponse = "🌅 Good morning! How may I help you start your day? ☕";
      } else if (lowerText.includes("good afternoon")) {
        botResponse = "🌞 Good afternoon! What can I do for you? 📚";
      } else if (lowerText.includes("good evening")) {
        botResponse = "🌙 Good evening! How can I assist you this evening? 🛋️";
      } else {
        botResponse = "👋 Hi! How can I help? 😊";
      }

      const greetingMessage = {
        sender: "bot",
        text: botResponse,
        timestamp: new Date().toISOString(),
      };
      await logAndSetMessage(greetingMessage);
      return;
    }

    if (!currentAuthToken) {
      const botResponse = {
        sender: "bot",
        text: "Please log in to use this feature.",
        timestamp: new Date().toISOString(),
      };
      await logAndSetMessage(botResponse);
      return;
    }
    const lastBotMessage = lastBotMessageRef.current;

    if (lastBotMessage?.awaitingConfirmation?.type === "checkout") {
      const confirmationText = text.toLowerCase().trim();

      if (confirmationText === "yes") {
        try {
          const response = await api.placeOrder();
          const successMessage = {
            sender: "bot",
            text: `✅ Yay! Your order was placed successfully. 🎊 Order ID: ${
              response.order_id || "N/A"
            }. Your cart is now empty. 🛍️`,
            timestamp: new Date().toISOString(),
          };
          setMessages((currentMsgs) => [
            ...currentMsgs.filter((msg) => !msg.awaitingConfirmation),
            {
              ...successMessage,
              timestamp: formatDisplayTimestamp(successMessage.timestamp),
            },
          ]);
          lastBotMessageRef.current = {
            ...successMessage,
            timestamp: formatDisplayTimestamp(successMessage.timestamp),
          };
          await api.saveMessage(
            successMessage.sender,
            successMessage.text,
            successMessage.timestamp
          );
          setCartItems([]);
          fetchUserCart();
        } catch (error) {
          console.error("Error placing order:", error);
          const errorMessage =
            error.response?.data?.message ||
            "Failed to place order. Please try again.";
          const errorBotMessage = {
            sender: "bot",
            text: errorMessage,
            timestamp: new Date().toISOString(),
          };
          setMessages((currentMsgs) => [
            ...currentMsgs.filter((msg) => !msg.awaitingConfirmation),
            {
              ...errorBotMessage,
              timestamp: formatDisplayTimestamp(errorBotMessage.timestamp),
            },
          ]);
          lastBotMessageRef.current = {
            ...errorBotMessage,
            timestamp: formatDisplayTimestamp(errorBotMessage.timestamp),
          };
          await api.saveMessage(
            errorBotMessage.sender,
            errorBotMessage.text,
            errorBotMessage.timestamp
          );
        }
        return;
      } else if (confirmationText === "no") {
        const cancelMessage = {
          sender: "bot",
          text: "🚫 Order cancelled.",
          timestamp: new Date().toISOString(),
        };
        setMessages((currentMsgs) => [
          ...currentMsgs.filter((msg) => !msg.awaitingConfirmation),
          {
            ...cancelMessage,
            timestamp: formatDisplayTimestamp(cancelMessage.timestamp),
          },
        ]);
        lastBotMessageRef.current = {
          ...cancelMessage,
          timestamp: formatDisplayTimestamp(cancelMessage.timestamp),
        };
        await api.saveMessage(
          cancelMessage.sender,
          cancelMessage.text,
          cancelMessage.timestamp
        );
        return;
      } else {
        const rePromptMessage = {
          sender: "bot",
          text: "👍 Say 'yes' to confirm or 👎 'no' to cancel.",
          timestamp: new Date().toISOString(),
          awaitingConfirmation: lastBotMessage.awaitingConfirmation,
        };
        await logAndSetMessage(rePromptMessage);
        return;
      }
    }

    const { keywords, isFullResetIntent } = extractSearchQueryKeywords(text);

    let updatedFilters = { ...currentFilters };

    if (isFullResetIntent) {
      updatedFilters = { q: "", genre: "", minPrice: "", maxPrice: "" };
      const resetConfirmation = {
        sender: "bot",
        text: "🧼 Filters wiped clean! What’s next on your list? 📚",
        timestamp: new Date().toISOString(),
      };
      await logAndSetMessage(resetConfirmation);
      return;
    }

    const checkoutRegex =
      /^(?:checkout|place my order|buy now|confirm order|finish order)\b/i;
    if (checkoutRegex.test(text)) {
      if (cartItems.length === 0) {
        const emptyCartMessage = {
          sender: "bot",
          text: "🛍️ Oops! Your cart is still empty. Add some items before checking out. 😊",
          timestamp: new Date().toISOString(),
        };
        await logAndSetMessage(emptyCartMessage);
        return;
      }
      const confirmationPrompt = {
        sender: "bot",
        text: "🛍️ Are you sure you want to place this order? ✅ Type 'yes' to confirm or ❌ 'no' to cancel.",
        timestamp: new Date().toISOString(),
        awaitingConfirmation: { type: "checkout" },
      };
      await logAndSetMessage(confirmationPrompt);
      return;
    }

    const viewCartRegex = /^(?:view|show)(?:\s+my)?\s+cart\b/i;
    if (viewCartRegex.test(text)) {
      const viewCartMessage = {
        sender: "bot",
        text: "🛒 Alright, taking you to your cart! 🚀",
        timestamp: new Date().toISOString(),
      };
      await logAndSetMessage(viewCartMessage);
      setTimeout(() => {
        navigate("/cart");
      }, 1500);
      return;
    }

    const viewOrdersRegex = /^(?:view|show)(?:\s+my)?\s+orders\b/i;
    if (viewOrdersRegex.test(text)) {
      const viewOrdersMessage = {
        sender: "bot",
        text: "📦 Sure, here are your past orders! 🧾",
        timestamp: new Date().toISOString(),
      };
      await logAndSetMessage(viewOrdersMessage);
      setTimeout(() => {
        navigate("/orders");
      }, 1500);
      return;
    }

    const removeCartRegex =
      /^(?:remove|delete)(?:\s+(\d+))?\s+(?:of\s+)?(.+?)(?:\s+from\s+cart)?$/i;
    let removeMatch = text.match(removeCartRegex);

    if (removeMatch) {
      const requestedQuantityInput = removeMatch[1];
      const requestedQuantityToRemove = requestedQuantityInput
        ? parseInt(requestedQuantityInput, 10)
        : 0;

      const requestedTitle = removeMatch[2].trim();

      let itemToRemove = cartItems.find(
        (item) => item.title.toLowerCase() === requestedTitle.toLowerCase()
      );

      if (!itemToRemove) {
        const notFoundMessage = {
          sender: "bot",
          text: `Hmm 🤔 I couldn't find "${requestedTitle}" in your cart. Want to search again? 🔍`,
          timestamp: new Date().toISOString(),
        };
        await logAndSetMessage(notFoundMessage);
        return;
      }

      if (
        requestedQuantityToRemove === 0 ||
        requestedQuantityToRemove >= itemToRemove.quantity
      ) {
        try {
          await api.removeFromCart(itemToRemove.product_id);
          const removedMessage = {
            sender: "bot",
            text: `✅ "${itemToRemove.title}" has been removed from your cart. Let me know if you need anything else! 😊`,
            timestamp: new Date().toISOString(),
          };
          await logAndSetMessage(removedMessage);
          fetchUserCart();
        } catch (error) {
          console.error("Error removing item via command:", error);
          const errorMessage =
            error.response?.data?.message || "Failed to remove item from cart.";
          const errorBotMessage = {
            sender: "bot",
            text: errorMessage,
            timestamp: new Date().toISOString(),
          };
          await logAndSetMessage(errorBotMessage);
        }
      } else if (requestedQuantityToRemove > 0) {
        const newQuantity = itemToRemove.quantity - requestedQuantityToRemove;
        try {
          await api.updateCartItem(itemToRemove.product_id, newQuantity);
          const updatedMessage = {
            sender: "bot",
            text: `🧹 Took out ${requestedQuantityToRemove} of "${itemToRemove.title}". You've got ${newQuantity} left! 😄`,
            timestamp: new Date().toISOString(),
          };
          await logAndSetMessage(updatedMessage);
          fetchUserCart();
        } catch (error) {
          console.error("Error updating quantity via command:", error);
          const errorMessage =
            error.response?.data?.message ||
            "Failed to update item quantity in cart.";
          const errorBotMessage = {
            sender: "bot",
            text: errorMessage,
            timestamp: new Date().toISOString(),
          };
          await logAndSetMessage(errorBotMessage);
        }
      }
      return;
    }

    const updateQuantityRegex =
      /^(?:update|change|set)\s+(.+?)(?:\s+quantity)?\s+(?:to|as)\s*(\d+)$/i;
    let updateMatch = text.match(updateQuantityRegex);

    if (updateMatch) {
      const requestedTitle = updateMatch[1].trim();
      const newQuantity = parseInt(updateMatch[2], 10);

      if (isNaN(newQuantity) || newQuantity < 0) {
        const invalidQuantityMessage = {
          sender: "bot",
          text: "⚠️ Invalid quantity for update. Please provide a non-negative number. 🔢",
          timestamp: new Date().toISOString(),
        };
        await logAndSetMessage(invalidQuantityMessage);
        return;
      }

      let itemToUpdate = cartItems.find(
        (item) => item.title.toLowerCase() === requestedTitle.toLowerCase()
      );

      if (!itemToUpdate) {
        const notFoundMessage = {
          sender: "bot",
          text: `🤔 Hmm... "${requestedTitle}" isn't in your cart, so I can't update its quantity. Want to add it instead? ➕`,
          timestamp: new Date().toISOString(),
        };
        await logAndSetMessage(notFoundMessage);
        return;
      }

      if (newQuantity === 0) {
        try {
          await api.removeFromCart(itemToUpdate.product_id);
          const removedMessage = {
            sender: "bot",
            text: `🗑️ "${itemToUpdate.title}" has been removed from your cart. 🛒`,
            timestamp: new Date().toISOString(),
          };
          await logAndSetMessage(removedMessage);
          fetchUserCart();
        } catch (error) {
          console.error("Error removing item during quantity update:", error);
          const errorMessage =
            error.response?.data?.message || "Failed to remove item from cart.";
          const errorBotMessage = {
            sender: "bot",
            text: errorMessage,
            timestamp: new Date().toISOString(),
          };
          await logAndSetMessage(errorBotMessage);
        }
        return;
      }

      const currentStock = itemToUpdate.stock;
      if (newQuantity > currentStock) {
        const stockMessage = {
          sender: "bot",
          text: `😕 We only have ${currentStock} of "${itemToUpdate.title}" in stock. Please choose a lower quantity than ${newQuantity}.`,
          timestamp: new Date().toISOString(),
        };
        await logAndSetMessage(stockMessage);
        return;
      }

      try {
        await api.updateCartItem(itemToUpdate.product_id, newQuantity);
        const updatedMessage = {
          sender: "bot",
          text: `🎉 Updated! You now have ${newQuantity} of "${itemToUpdate.title}" in your cart. 🛍️`,
          timestamp: new Date().toISOString(),
        };
        await logAndSetMessage(updatedMessage);
        fetchUserCart();
      } catch (error) {
        console.error("Error updating quantity via command:", error);
        const errorMessage =
          error.response?.data?.message || "Failed to update item quantity.";
        const errorBotMessage = {
          sender: "bot",
          text: errorMessage,
          timestamp: new Date().toISOString(),
        };
        await logAndSetMessage(errorBotMessage);
      }
      return;
    }

    const fetchAllProductsRegex =
      /^(?:show|view|list|display)(?: me)?(?: all| every(?:thing)?)?\s*(?:your\s+)?(?:products?|items?|books?)?\b|^(?:what do you have(?: available)?|whats (?:for )?sale|what is available)\b|^(?:all|every(?:thing)?)\s*(?:products?|items?|books?)\b/i;

    if (fetchAllProductsRegex.test(text)) {
      try {
        const allProducts = await api.getAllProducts();

        if (allProducts && allProducts.length > 0) {
          const successMessage = {
            sender: "bot",
            text: "🎉 Take a look! Here’s everything we have in store for you: 🛒",
            timestamp: new Date().toISOString(),
            type: "products",
            data: allProducts,
          };
          await logAndSetMessage(successMessage);
        } else {
          const noProductsMessage = {
            sender: "bot",
            text: "📭 Oops! No products are available right now. Please check back soon! 😊",
            timestamp: new Date().toISOString(),
          };
          await logAndSetMessage(noProductsMessage);
        }
      } catch (error) {
        console.error("Error fetching all products:", error);
        const errorMessage = {
          sender: "bot",
          text: "😕 Sorry! I ran into a hiccup fetching all products. Try again in a bit. 🔁",
          timestamp: new Date().toISOString(),
        };
        await logAndSetMessage(errorMessage);
      }
      return;
    }

    const addToCartRegex =
      /^(?:add to cart|put in cart|buy|get|add|put|order)(?::|\s+)?\s*(.+?)(?:,\s*|\s+(?:with\s+)?quantity\s*)(\d+)$/i;
    const match = text.match(addToCartRegex);

    if (match) {
      const requestedTitle = match[1].trim();
      const requestedQuantity = parseInt(match[2], 10);

      if (isNaN(requestedQuantity) || requestedQuantity <= 0) {
        const invalidQuantityMessage = {
          sender: "bot",
          text: "🚫 Oops! That’s not a valid quantity. Please enter a number greater than zero. 😊",
          timestamp: new Date().toISOString(),
        };
        await logAndSetMessage(invalidQuantityMessage);
        return;
      }

      let foundProduct = null;
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.type === "products" && msg.data && msg.data.length > 0) {
          foundProduct = msg.data.find(
            (p) => p.title.toLowerCase() === requestedTitle.toLowerCase()
          );
          if (foundProduct) {
            break;
          }
        }
      }
      if (!foundProduct) {
        const existingCartItem = cartItems.find(
          (item) => item.title.toLowerCase() === requestedTitle.toLowerCase()
        );
        if (existingCartItem) {
          foundProduct = {
            id: existingCartItem.product_id,
            title: existingCartItem.title,
            stock: existingCartItem.stock,
          };
        }
      }

      if (!foundProduct) {
        const notFoundMessage = {
          sender: "bot",
          text: `🔍 Sorry, I couldn't find "${requestedTitle}" in the products I've displayed recently or in your cart. 🛒 Please make sure the title is exact. ✏️`,
          timestamp: new Date().toISOString(),
        };
        await logAndSetMessage(notFoundMessage);
        return;
      }

      const currentInCartQuantity =
        cartItems.find((item) => item.product_id === foundProduct.id)
          ?.quantity || 0;
      const totalRequestedQuantity = currentInCartQuantity + requestedQuantity;

      if (foundProduct.stock < totalRequestedQuantity) {
        const stockMessage = {
          sender: "bot",
          text: `📦 Oops! We only have ${foundProduct.stock} of "${foundProduct.title}" in stock. You already have ${currentInCartQuantity} in your cart and requested ${requestedQuantity} more. 😊`,
          timestamp: new Date().toISOString(),
        };
        await logAndSetMessage(stockMessage);
        return;
      }

      try {
        await handleAddToCart(foundProduct.id, requestedQuantity);
        const addedMessage = {
          sender: "bot",
          text: `🎉 ${requestedQuantity} of "${foundProduct.title}" added to your cart! 🛍️`,
          timestamp: new Date().toISOString(),
        };
        await logAndSetMessage(addedMessage);
      } catch (error) {
        console.error("Error adding to cart via command:", error);
        const errorMessage = {
          sender: "bot",
          text: `😕 Uh-oh! Something went wrong while adding "${foundProduct.title}" to your cart. Please try again shortly. 🔁`,
          timestamp: new Date().toISOString(),
        };
        await logAndSetMessage(errorMessage);
      }
      return;
    }

    const {
      minPrice: parsedMinPrice,
      maxPrice: parsedMaxPrice,
      cleanedText: textWithoutPrice,
    } = parsePriceFiltersFromText(text);

    let tempTextForKeywords = textWithoutPrice;

    let parsedGenres = [];
    const possibleGenres = [
      "fiction",
      "fantasy",
      "mystery",
      "thriller",
      "romance",
      "sci-fi",
      "science fiction",
      "horror",
      "biography",
      "history",
      "poetry",
    ];
    const foundGenreKeywords = [];

    for (const pg of possibleGenres) {
      const genreRegex = new RegExp(`\\b${pg}\\b`, "g");
      if (tempTextForKeywords.match(genreRegex)) {
        parsedGenres.push(pg);
        foundGenreKeywords.push(...pg.split(" "));
        tempTextForKeywords = tempTextForKeywords
          .replace(genreRegex, " ")
          .trim();
      }
    }

    const { keywords: extractedKeywords, isResetIntent } =
      extractSearchQueryKeywords(tempTextForKeywords, foundGenreKeywords);

    let processedQuery = extractedKeywords;
    if (isResetIntent && extractedKeywords === "") {
      processedQuery = "";
    }

    let finalFiltersForApi = {
      genre: [],
      minPrice: "",
      maxPrice: "",
    };

    if (isResetIntent) {
      if (parsedGenres.length > 0) {
        finalFiltersForApi.genre = parsedGenres;
      }
      if (parsedMinPrice || parsedMaxPrice) {
        finalFiltersForApi.minPrice = parsedMinPrice;
        finalFiltersForApi.maxPrice = parsedMaxPrice;
      }
    } else {
      if (currentFilters.genre && parsedGenres.length === 0) {
        finalFiltersForApi.genre = [currentFilters.genre];
      }
      if (parsedGenres.length > 0) {
        finalFiltersForApi.genre = parsedGenres;
      }

      if (!parsedMinPrice && !parsedMaxPrice) {
        if (currentFilters.minPrice) {
          finalFiltersForApi.minPrice = currentFilters.minPrice;
        }
        if (currentFilters.maxPrice) {
          finalFiltersForApi.maxPrice = currentFilters.maxPrice;
        }
      }
      if (parsedMinPrice || parsedMaxPrice) {
        finalFiltersForApi.minPrice = parsedMinPrice;
        finalFiltersForApi.maxPrice = parsedMaxPrice;
      }
    }

    setFilters((prevFilters) => ({
      ...prevFilters,
      genre:
        finalFiltersForApi.genre.length > 0 ? finalFiltersForApi.genre[0] : "",
      minPrice: finalFiltersForApi.minPrice,
      maxPrice: finalFiltersForApi.maxPrice,
    }));

    const hasQuery = processedQuery.trim() !== "";
    const hasGenreFilter =
      finalFiltersForApi.genre && finalFiltersForApi.genre.length > 0;
    const hasPriceFilter =
      finalFiltersForApi.minPrice !== "" || finalFiltersForApi.maxPrice !== "";

    if (!hasQuery && !hasGenreFilter && !hasPriceFilter) {
      const botResponse = {
        sender: "bot",
        text: "🤔 Hmm... that query was a bit too general or unclear. Try using more specific keywords to help me out! 😊",
        timestamp: new Date().toISOString(),
      };
      await logAndSetMessage(botResponse);
      return;
    }

    try {
      const products = await api.searchProducts(
        processedQuery,
        finalFiltersForApi.genre,
        finalFiltersForApi.minPrice,
        finalFiltersForApi.maxPrice
      );

      let responseText = `Here are some books `;
      let criteria = [];

      if (hasQuery) {
        criteria.push(`matching "${processedQuery}"`);
      }

      if (hasGenreFilter) {
        criteria.push(`in ${finalFiltersForApi.genre.join(" and ")}`);
      }

      if (hasPriceFilter) {
        let pricePart = "";
        if (finalFiltersForApi.minPrice && finalFiltersForApi.maxPrice) {
          pricePart = `between $${finalFiltersForApi.minPrice} and $${finalFiltersForApi.maxPrice}`;
        } else if (finalFiltersForApi.minPrice) {
          pricePart = `over $${finalFiltersForApi.minPrice}`;
        } else if (finalFiltersForApi.maxPrice) {
          pricePart = `under $${finalFiltersForApi.maxPrice}`;
        }
        if (pricePart) {
          criteria.push(`priced ${pricePart}`);
        }
      }

      if (criteria.length > 0) {
        responseText += criteria.join(" ");
      } else {
        responseText += "matching your criteria";
      }
      responseText += ":";

      if (products && products.length > 0) {
        const productMessage = {
          sender: "bot",
          type: "products",
          data: products,
          text: responseText,
          timestamp: new Date().toISOString(),
        };
        await logAndSetMessage(productMessage);
      } else {
        const noProductMessage = {
          sender: "bot",
          text: `😕 No books found ${criteria.join(
            " "
          )}. Don’t worry — try changing your search or tweaking the filters! 🔧📖`,
          timestamp: new Date().toISOString(),
        };
        await logAndSetMessage(noProductMessage);
      }
    } catch (error) {
      console.error("Error searching products:", error);
      let errorMessage = "An error occurred while searching. Please try again.";
      if (error.response && error.response.status === 401) {
        errorMessage = "Your session has expired. Please log in again.";
        handleLogout();
      }
      const errorBotMessage = {
        sender: "bot",
        text: errorMessage,
        timestamp: new Date().toISOString(),
      };
      await logAndSetMessage(errorBotMessage);
    }
  };

  const handleResetConversation = async () => {
    setMessages([]);
    let resetMessage;
    if (isLoggedIn && username) {
      resetMessage = {
        sender: "bot",
        text: `👋 Welcome back, ${username}! What book are you looking for today? 📚`,
        timestamp: formatDisplayTimestamp(new Date().toISOString()),
      };
    } else {
      resetMessage = {
        sender: "bot",
        text: "👋 To start chatting, please log in or register first. 📝",
        timestamp: formatDisplayTimestamp(new Date().toISOString()),
      };
    }
    setMessages([resetMessage]);
    lastBotMessageRef.current = resetMessage;
    setFilters({ genre: "", minPrice: "", maxPrice: "" });
    setShowFilterDropdown(false);
  };

  const handleFilterChange = (newFilters) => {
    setFilters((prevFilters) => ({ ...prevFilters, ...newFilters }));
  };

  const handleSearchWithFilters = (queryText) => {
    handleSendMessage(queryText, authToken, filters);
  };

  const handleToggleFilterDropdown = () => {
    setShowFilterDropdown((prev) => !prev);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>BookSy: Browse & Buy</h1>
        <div className="header-actions">
          {isLoggedIn && (
            <div>
              <button onClick={handleResetConversation} className="btn">
                Reset Chat
              </button>
            </div>
          )}
          {isLoggedIn && (
            <>
              <button onClick={handleLogout} className="btn">
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      {message.text && (
        <div className={`app-message ${message.type}`}>{message.text}</div>
      )}

      <div className="chat-container">
        <Routes>
          <Route
            path="/"
            element={
              !isLoggedIn ? (
                <LoginRegister onLoginSuccess={handleLoginSuccess} />
              ) : (
                <>
                  {/* <div className="filter-toggle-bar" onClick={handleToggleFilterDropdown}>
                    <span>Manual Filters</span>
                    <span className={`arrow-icon ${showFilterDropdown ? 'rotated' : ''}`}>
                        ▼
                    </span>
                </div> */}
                  <div
                    className={`filter-dropdown-wrapper ${
                      showFilterDropdown ? "open" : ""
                    }`}
                  >
                    <ProductFilter
                      filters={filters}
                      onFilterChange={handleFilterChange}
                      onApplyFilters={handleSearchWithFilters}
                    />
                  </div>
                  <ChatWindow
                    messages={messages}
                    onAddToCart={handleAddToCart}
                  />
                  <MessageInput
                    onSendMessage={handleSearchWithFilters}
                    authToken={authToken}
                  />
                </>
              )
            }
          />
          <Route
            path="/register"
            element={
              <LoginRegister
                onLoginSuccess={handleLoginSuccess}
                initialMode="register"
              />
            }
          />
          <Route
            path="/cart"
            element={
              isLoggedIn ? (
                <CartDisplay
                  fetchCartItems={fetchUserCart}
                  cartItems={cartItems}
                  setCartItems={setCartItems}
                  showMessage={showMessage}
                />
              ) : (
                <p>Please log in to view your cart.</p>
              )
            }
          />
          <Route
            path="/orders"
            element={
              isLoggedIn ? (
                <OrderHistory showMessage={showMessage} />
              ) : (
                <p>Please log in to view your orders.</p>
              )
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
