# 🚀 Guía de Despliegue a Google Play Store

¡Felicidades! Llevar tu aplicación a la Play Store es el siguiente gran paso. Dado que tu aplicación es una Aplicación Web Progresiva (PWA), el proceso para publicarla en la Play Store implica "envolverla" en un contenedor nativo de Android. La herramienta oficial de Google para esto se llama **Bubblewrap**.

He preparado tu aplicación para este proceso y esta guía te llevará de la mano en los pasos que debes realizar por tu cuenta.

---

## Preparativos Realizados por la IA

Para que este proceso funcione, ya he realizado dos cambios cruciales en tu código:

1.  **Manifiesto de la App Actualizado:** Modifiqué `src/app/manifest.ts` para incluir los íconos necesarios que la Play Store y Android requieren.
2.  **Verificación de Propiedad:** Creé el archivo `public/.well-known/assetlinks.json`. Este es un "archivo de confianza" que le prueba a Google que la app de Android que vas a crear te pertenece. **Más adelante tendrás que editar este archivo con tu información específica.**

---

## Pasos para Publicar (Tu Misión)

Sigue estos pasos en tu computadora local. Necesitarás tener **Node.js** instalado.

### Paso 1: Instalar Bubblewrap CLI

Abre una terminal o línea de comandos en tu computadora y ejecuta este comando para instalar la herramienta de Google:

```bash
npm install -g @bubblewrap/cli
```

### Paso 2: Inicializar tu Proyecto de Android

1.  Primero, asegúrate de que tu aplicación web esté desplegada en Firebase Hosting y tengas la URL (ej. `https://tu-app.web.app`).
2.  En la terminal, navega a una carpeta donde quieras guardar los archivos de tu proyecto de Android (ej. `cd Documents/ProyectosAndroid`).
3.  Ejecuta el siguiente comando, reemplazando la URL con la de tu aplicación desplegada:

    ```bash
    bubblewrap init --manifest https://tu-app-id.web.app/manifest.json
    ```

Bubblewrap te hará una serie de preguntas. La mayoría puedes aceptarlas con "Enter". Presta atención a estas:

*   **Application ID (package name):** Es muy importante. Debe ser único, en formato `com.tudominio.tuapp`. Por ejemplo: `com.agritaskmaster.app`. **¡Anótalo, lo necesitarás!**
*   **Signing key:** Bubblewrap te preguntará sobre una clave de firma. Acepta los valores por defecto para que cree una nueva para ti. Te pedirá una contraseña. **¡Guarda esta contraseña en un lugar seguro! La necesitarás para futuras actualizaciones.**

### Paso 3: Obtener la Huella Digital SHA-256

Este es el paso más técnico, pero es crucial.

1.  Una vez que Bubblewrap termine, te creará un archivo llamado `twa-manifest.json`.
2.  Dentro de ese archivo, busca la clave `sha256Fingerprints`. Copia el valor que aparece ahí. Es una cadena larga de letras y números separados por dos puntos.

### Paso 4: Actualizar `assetlinks.json` en tu Proyecto Web

1.  Vuelve al código de tu aplicación web.
2.  Abre el archivo que he creado en `public/.well-known/assetlinks.json`.
3.  Verás un contenido con placeholders. Tienes que reemplazar dos cosas:
    *   `package_name`: Pega aquí el **Application ID** que anotaste en el Paso 2.
    *   `sha256_cert_fingerprints`: Pega aquí la **huella digital SHA-256** que obtuviste en el Paso 3.

    **Ejemplo del antes:**
    ```json
    [{
      "relation": ["delegate_permission/common.handle_all_urls"],
      "target": {
        "namespace": "android_app",
        "package_name": "com.example.placeholder",
        "sha256_cert_fingerprints": ["00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00"]
      }
    }]
    ```

    **Ejemplo del después:**
    ```json
    [{
      "relation": ["delegate_permission/common.handle_all_urls"],
      "target": {
        "namespace": "android_app",
        "package_name": "com.agritaskmaster.app",
        "sha256_cert_fingerprints": ["A1:B2:C3:D4:E5:F6:A1:B2:C3:D4:E5:F6:A1:B2:C3:D4:E5:F6:A1:B2:C3:D4:E5:F6:A1:B2:C3:D4:E5:F6:A1:B2"]
      }
    }]
    ```
4.  **Vuelve a desplegar tu aplicación web** con estos cambios para que el archivo `assetlinks.json` esté en línea.

### Paso 5: Construir tu App de Android

1.  Vuelve a la terminal, en la carpeta de tu proyecto de Android.
2.  Ejecuta el comando de construcción:

    ```bash
    bubblewrap build
    ```

    Esto generará un archivo llamado `app-release-bundle.aab`. ¡Este es el archivo que subirás a la Play Store!

### Paso 6: Publicar en Google Play Console

1.  Ve a la [Google Play Console](https://play.google.com/console).
2.  Crea una nueva aplicación.
3.  Sigue todos los pasos que te pide la consola (descripción de la app, íconos, política de privacidad, etc.).
4.  Cuando te pida subir un "App Bundle", sube el archivo `app-release-bundle.aab` que creaste.

¡Y listo! Una vez que Google apruebe tu aplicación, estará disponible en la Play Store para que todo el mundo pueda descargarla.

---

Este proceso puede parecer un poco largo la primera vez, pero al seguir esta guía paso a paso, lo lograrás sin problemas. ¡Mucho éxito con tu lanzamiento!
