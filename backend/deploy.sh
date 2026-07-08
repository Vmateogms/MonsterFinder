#!/bin/bash

# Script para desplegar la aplicación Monster Map

# 1. Construir el proyecto
echo "Construyendo el proyecto con Maven..."
./mvnw clean package -DskipTests

# 2. Verificar que se creó correctamente el JAR
if [ ! -f target/monstermapa-0.0.1-SNAPSHOT.jar ]; then
  echo "Error: No se pudo crear el archivo JAR"
  exit 1
fi

# 3. Desplegar el JAR
echo "Desplegando la aplicación en el puerto 8080..."
java -jar target/monstermapa-0.0.1-SNAPSHOT.jar --server.port=8080

echo "Aplicación desplegada correctamente!" 