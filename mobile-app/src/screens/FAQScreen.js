import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const FAQScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState("");
  const [expandedItems, setExpandedItems] = useState({});
  const [filteredFAQs, setFilteredFAQs] = useState([]);

  const faqs = [
    {
      id: 1,
      question: "How do I report a suspected waterborne disease outbreak?",
      answer:
        "To report a suspected waterborne disease outbreak, use the Patient Report feature in the app. Provide detailed information about symptoms, affected individuals, and suspected water source. For immediate emergencies, also contact your local health authorities at the emergency numbers provided in the app.",
      category: "Health Emergency",
    },
    {
      id: 2,
      question: "What should I do if my water supply seems contaminated?",
      answer:
        "If you suspect water contamination: 1) Stop using the water immediately for drinking or cooking, 2) Report it using the Water Quality Report feature, 3) Use bottled water or boil water for at least 1 minute before use, 4) Contact local water authorities, 5) Collect a sample if possible for testing.",
      category: "Water Safety",
    },
    {
      id: 3,
      question:
        "What are the symptoms of waterborne diseases I should watch for?",
      answer:
        "Common symptoms include: Diarrhea (watery or bloody), vomiting, nausea, abdominal cramps, fever, dehydration, headache, and fatigue. Severe symptoms like persistent high fever, severe dehydration, or bloody stools require immediate medical attention.",
      category: "Health",
    },
    {
      id: 4,
      question: "How can I prevent waterborne diseases?",
      answer:
        "Prevention methods: 1) Drink only safe, treated water, 2) Boil water for at least 1 minute if unsure, 3) Use proper sanitation and hygiene, 4) Wash hands frequently with soap, 5) Avoid ice from unknown sources, 6) Eat only properly cooked food, 7) Keep water storage containers clean.",
      category: "Prevention",
    },
    {
      id: 5,
      question: "Where can I get my water tested for quality?",
      answer:
        "Water testing options: 1) Contact your local health department, 2) Use certified private laboratories, 3) Some pharmacies offer basic testing kits, 4) Government water testing centers, 5) NGO health centers in your area. The app provides a directory of nearby testing facilities.",
      category: "Testing",
    },
    {
      id: 6,
      question: "What water quality parameters should I be concerned about?",
      answer:
        "Key parameters to monitor: pH (6.5-8.5), turbidity (low is better), bacterial contamination (E. coli, coliform), chemical contaminants (heavy metals, pesticides), dissolved oxygen, temperature, and visual indicators like color, odor, and taste.",
      category: "Testing",
    },
    {
      id: 7,
      question: "How quickly should I report health issues related to water?",
      answer:
        "Report immediately for: severe symptoms, multiple people affected, suspected outbreak, or emergency situations. For mild symptoms, report within 24 hours. Early reporting helps prevent spread and enables quick response from health authorities.",
      category: "Reporting",
    },
    {
      id: 8,
      question: "What information should I include in a water quality report?",
      answer:
        "Include: exact location and GPS coordinates, water source type, visual observations (color, odor, taste), testing results if available, date and time of sample collection, your contact information, and any photos of the water source or testing results.",
      category: "Reporting",
    },
  ];

  useEffect(() => {
    filterFAQs();
  }, [searchText]);

  const filterFAQs = () => {
    if (!searchText.trim()) {
      setFilteredFAQs(faqs);
    } else {
      const filtered = faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchText.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchText.toLowerCase()) ||
          faq.category.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredFAQs(filtered);
    }
  };

  const toggleExpanded = (id) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "Health Emergency":
        return "#F44336";
      case "Water Safety":
        return "#2196F3";
      case "Health":
        return "#FF9800";
      case "Prevention":
        return "#4CAF50";
      case "Testing":
        return "#9C27B0";
      case "Reporting":
        return "#607D8B";
      default:
        return "#666";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search frequently asked questions"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

          {filteredFAQs.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search" size={48} color="#ccc" />
              <Text style={styles.noResultsText}>
                No FAQs found matching your search
              </Text>
              <Text style={styles.noResultsSubtext}>
                Try different keywords or browse all questions
              </Text>
            </View>
          ) : (
            filteredFAQs.map((faq) => (
              <View key={faq.id} style={styles.faqCard}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => toggleExpanded(faq.id)}
                >
                  <View style={styles.faqHeaderContent}>
                    <View
                      style={[
                        styles.categoryTag,
                        { backgroundColor: getCategoryColor(faq.category) },
                      ]}
                    >
                      <Text style={styles.categoryText}>{faq.category}</Text>
                    </View>
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                  </View>
                  <Ionicons
                    name={expandedItems[faq.id] ? "chevron-up" : "chevron-down"}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>

                {expandedItems[faq.id] && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Still have questions?</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.goBack()}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="chatbubble" size={24} color="#2196F3" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Submit a Query</Text>
              <Text style={styles.actionDescription}>
                Ask our experts directly
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="call" size={24} color="#4CAF50" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Emergency Helpline</Text>
              <Text style={styles.actionDescription}>
                For urgent health emergencies
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="document-text" size={24} color="#FF9800" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Guidelines & Resources</Text>
              <Text style={styles.actionDescription}>
                Detailed information and guides
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  noResultsContainer: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "white",
    borderRadius: 8,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  faqCard: {
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  faqHeaderContent: {
    flex: 1,
  },
  categoryTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    lineHeight: 22,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  faqAnswerText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginTop: 12,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  actionDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
});

export default FAQScreen;
