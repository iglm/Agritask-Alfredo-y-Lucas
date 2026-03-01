"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LegalPage() {
  return (
    <div>
      <PageHeader title="Información Legal y Contacto" />
      <div className="max-w-4xl space-y-8">
        
        <Card>
          <CardHeader>
            <CardTitle>Política de Privacidad y Términos de Servicio</CardTitle>
            <CardDescription>Conforme a la Ley 1581 de 2012 y normativas aplicables en Colombia.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Este documento establece las políticas de tratamiento de datos personales, privacidad y términos de servicio aplicables a los usuarios del **Optimizador de Labores Agrícolas** (en adelante "la aplicación"), una plataforma web diseñada para la gestión de fincas agrícolas.
            </p>
            
            <h3 className="font-semibold text-foreground pt-2">1. Vigencia y Aceptación</h3>
            <p>
              La presente política rige a partir de su publicación en el año 2024 y permanecerá vigente hasta que sea reemplazada por una versión actualizada. El uso continuado de nuestros servicios implica la aceptación de esta política. Nos comprometemos a cumplir con la legislación colombiana en materia de protección de datos personales, específicamente la Ley 1581 de 2012 y el Decreto 1377 de 2013.
            </p>

            <h3 className="font-semibold text-foreground pt-2">2. Identificación del Responsable del Tratamiento</h3>
            <p>
              Los responsables del tratamiento de los datos personales son los desarrolladores y titulares de la aplicación:
            </p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-semibold text-foreground">Lucas Mateo Tabares Franco</h4>
                    <a href="mailto:mateotabares7@gmail.com" className="text-sm text-primary hover:underline">mateotabares7@gmail.com</a>
                </div>
                <div>
                    <h4 className="font-semibold text-foreground">Alfredo García Llano</h4>
                    <a href="mailto:alfredo.agropecuario@gmail.com" className="text-sm text-primary hover:underline">alfredo.agropecuario@gmail.com</a>
                </div>
            </div>
            <p>
              Ambos actúan como responsables conjuntos del tratamiento y garantizan la protección de la información conforme a los lineamientos aquí descritos.
            </p>
            
            <h3 className="font-semibold text-foreground pt-2">3. Política de Tratamiento de Datos Personales</h3>
             <p className="font-medium">Principios Rectores:</p>
            <p>
                Nos guiamos por los principios de legalidad, finalidad, libertad, veracidad, transparencia, acceso y circulación restringida, seguridad y confidencialidad.
            </p>

            <p className="font-medium mt-2">Finalidades del Tratamiento:</p>
            <p>
              Recolectamos y tratamos tus datos con el único fin de prestar, mejorar y asegurar el servicio, lo que incluye:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                **Prestación del servicio:** Gestionar y almacenar la información de tu operación agrícola (lotes, labores, finanzas, etc.), permitir la sincronización en la nube y el funcionamiento sin conexión.
              </li>
              <li>
                **Mejora del producto:** Analizar datos de uso de forma agregada y anónima para optimizar la aplicación, corregir errores y desarrollar nuevas funcionalidades, incluyendo el entrenamiento y la mejora de los agentes de inteligencia artificial.
              </li>
               <li>
                **Gestión administrativa:** Administrar cuentas de usuario, ofrecer soporte técnico y cumplir con obligaciones legales.
              </li>
            </ul>

            <p className="font-medium mt-2">Categorías de Datos Recolectados:</p>
             <ul className="list-disc space-y-2 pl-5">
                <li>
                    **Datos de Identificación:** Nombre, correo electrónico y ID de usuario proporcionados por el servicio de autenticación de Google al momento del registro.
                </li>
                 <li>
                    **Datos de la Operación:** Toda la información que registres voluntariamente en la aplicación, como detalles de unidades productivas, lotes, personal, inventario, labores y finanzas.
                </li>
                 <li>
                    **Datos de Uso:** Información técnica sobre la interacción con la aplicación, como registros de errores, para fines de diagnóstico y mejora.
                </li>
            </ul>
             <p>
                <strong>Importante:</strong> No recolectamos datos considerados sensibles (salud, biométricos, etc.) ni datos de menores de edad de forma consciente.
            </p>

             <p className="font-medium mt-2">Derechos del Titular (Habeas Data):</p>
             <p>
                Como titular de los datos, tienes derecho a:
            </p>
             <ul className="list-disc space-y-2 pl-5">
                <li>
                    Conocer, actualizar y rectificar tus datos personales.
                </li>
                <li>
                   Solicitar prueba de la autorización otorgada para el tratamiento.
                </li>
                 <li>
                    Revocar el consentimiento y/o solicitar la supresión de tus datos.
                </li>
                 <li>
                    Acceder en forma gratuita a tus datos personales.
                </li>
            </ul>
            <p>
              Para ejercer estos derechos, puedes contactarnos a través de los correos electrónicos proporcionados en la sección de contacto. Responderemos en los plazos establecidos por la ley.
            </p>

            <h3 className="font-semibold text-foreground pt-2">4. Política de Privacidad</h3>
            <p className="font-medium">Uso y Divulgación de los Datos:</p>
             <p>
                Tus datos se utilizan exclusivamente para los fines descritos. Podremos compartir información con los siguientes proveedores tecnológicos que nos ayudan a prestar el servicio, quienes actúan como encargados del tratamiento y están obligados a garantizar la confidencialidad:
            </p>
            <ul className="list-disc space-y-2 pl-5">
                <li>
                    **Google (Firebase y Google Cloud):** Para autenticación, almacenamiento en base de datos (Firestore), alojamiento de la aplicación (App Hosting) y procesamiento de los modelos de inteligencia artificial (Genkit/Vertex AI).
                </li>
            </ul>
             <p>
                <strong>En ningún caso vendemos o cedemos tus datos personales a terceros para fines publicitarios.</strong>
            </p>

            <p className="font-medium mt-2">Seguridad de la Información:</p>
            <p>
                Implementamos medidas de seguridad técnicas y administrativas razonables para proteger tus datos, incluyendo el uso de la infraestructura segura de Google Cloud, reglas de seguridad en la base de datos para controlar el acceso y cifrado de datos en tránsito.
            </p>

            <p className="font-medium mt-2">Retención y Eliminación de Datos:</p>
            <p>
                Conservaremos tus datos mientras tu cuenta esté activa. Si decides eliminar tu cuenta, procederemos a la supresión segura de tu información, a menos que una obligación legal requiera su conservación por un tiempo adicional.
            </p>

             <h3 className="font-semibold text-foreground pt-2">5. Términos y Condiciones de Uso</h3>
             <p className="font-medium">Uso Adecuado del Servicio:</p>
             <p>
                Te comprometes a utilizar la aplicación de manera responsable y legal, y a proporcionar información veraz para el correcto funcionamiento de las herramientas de gestión.
            </p>

            <p className="font-medium mt-2">Uso de Inteligencia Artificial:</p>
            <p>
                La aplicación utiliza modelos de IA para generar análisis, planes y ejecutar comandos. Estas respuestas se basan en la información que proporcionas y en bases de conocimiento predefinidas. Te recomendamos validar siempre las sugerencias de la IA antes de tomar decisiones agronómicas o financieras críticas. Los desarrolladores no se responsabilizan por daños o pérdidas derivados de la adopción de recomendaciones sin la debida validación por parte de un profesional.
            </p>
            
            <p className="font-medium mt-2">Propiedad Intelectual:</p>
             <p>
                El software, su diseño, código y elementos gráficos son propiedad intelectual de sus desarrolladores. Se prohíbe la reproducción o distribución no autorizada. El contenido que tú generas (los datos de tu finca) es de tu propiedad; al usar la app, nos otorgas una licencia para usarlo con el fin de prestarte el servicio.
            </p>

            <p className="font-medium mt-2">Limitación de Responsabilidad:</p>
            <p>
                El servicio se presta "tal cual". No nos hacemos responsables por perjuicios directos o indirectos que surjan del uso o la imposibilidad de uso de la plataforma.
            </p>

            <p className="font-medium mt-2">Jurisdicción y Ley Aplicable:</p>
            <p>
                Para todos los efectos, estos términos se regirán por las leyes de la República de Colombia.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Desarrolladores y Contacto</CardTitle>
            <CardDescription>
              Esta aplicación es el resultado de la colaboración entre dos profesionales apasionados por la optimización del sector agropecuario.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-semibold text-foreground">Lucas Mateo Tabares Franco</h3>
                    <p className="text-sm">Ingeniero Agrónomo</p>
                    <a href="mailto:mateotabares7@gmail.com" className="text-sm text-primary hover:underline">mateotabares7@gmail.com</a>
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">Alfredo García Llano</h3>
                    <p className="text-sm">Administrador de Empresas Agropecuarias</p>
                    <a href="mailto:alfredo.agropecuario@gmail.com" className="text-sm text-primary hover:underline">alfredo.agropecuario@gmail.com</a>
                </div>
            </div>
            <p className="pt-4">
              Para soporte técnico, asesoría especializada, consultas sobre la aplicación, ejercicio de tus derechos de Habeas Data o propuestas comerciales, no dudes en contactarnos.
            </p>
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground pt-4">
          Última actualización: 2024. &copy; Lucas Mateo Tabares Franco & Alfredo García Llano. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
