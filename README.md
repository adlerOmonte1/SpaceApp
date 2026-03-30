# GameVault 🎮

**Student 1:** Adler Clin Omonte Sanchez

**Student 2:** Treycy Bridney Andres Sebastian

## 📝 Project Description
GameVault is a mobile application developed in React Native that functions as an interactive video game catalog. It allows users to explore a list of titles, view specific details with seamless navigation, read the latest gaming news, and simulate adding new games through a form.

## 💻 Technologies Used
* **Framework:** React Native CLI (Functional Components with Hooks)
* **Navigation:** React Navigation (Stack Navigation & Bottom Tabs)
* **State Management & Lifecycle:** React Hooks
* **User Interface:** React Native Safe Area Context, Vector Icons
* **Testing Platforms:** iOS Simulator and Android

## 🛠️ Installation and Setup Instructions

Follow these steps in your terminal to clone and run the project locally:

**1. Clone the repository and navigate to the folder:**
```bash
git clone https://github.com/adlerOmonte1/GameVault.git
cd GameVault
```
**2. Install all dependencies, navigation libraries, and icons:**
```bash
npm install
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated @react-native-masked-view/masked-view react-native-vector-icons react-native-worklets
```
**3. iOS Configuration (Mandatory on Mac):**
```bash
cd ios
pod install
cd ..
```
**4. Run the application:**

To start the project on the iPhone simulator (iOS):
```bash
npx react-native run-ios --simulator="iPhone 17"
```

To start the project on the Android emulator:
```bash
npx react-native run-android
```
