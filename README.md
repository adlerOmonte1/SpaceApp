# GameVault 🎮

**Estudiante 1:** Adler Clin Omonte Sanchez

**Estudiante 2:** Treycy Bridney Andres Sebastian

## 📝 Descripción del Proyecto
GameVault es una aplicación móvil desarrollada en React Native que funciona como un catálogo interactivo de videojuegos. Permite a los usuarios explorar una lista de títulos, consultar detalles específicos con navegación fluida, leer noticias de recintes de gaming y simular la adición de nuevos juegos mediante un formulario.

## 💻 Tecnologías Utilizadas
* Framework: React Native CLI (Funcional con Hooks)
* Navegación: React Navigation (Stack Navigation & Bottom Tabs)
* Gestión de Estado y Ciclo de Vida: React Hooks
* Interfaz de Usuario: React Native Safe Area Context, Vector Icons (Ionicons)
* Plataforma de pruebas: iOS Simulator y Android

## 🛠️ Instrucciones de Instalación y Ejecución

Sigue estos pasos en tu terminal para clonar y ejecutar el proyecto localmente:

**1. Clonar el repositorio y entrar a la carpeta:**
```bash
git clone https://github.com/adlerOmonte1/GameVault.git
cd GameVault
```
** 2. Instalar todas las dependencias y librerías de navegación e íconos:
```bash
npm install
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated @react-native-masked-view/masked-view react-native-vector-icons react-native-worklets
```
Configuración para iOS (Obligatorio en Mac):
```bash
cd ios
pod install
cd ..
```
Ejecutar la aplicación:
Para arrancar el proyecto en el simulador de iPhone (iOS):
```bash
npx react-native run-ios
```
Para arrancar el proyecto en el simulador de Android:
```bash
npx react-native run-android
```
