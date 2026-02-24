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
            <CardTitle>Política de Privacidad y Tratamiento de Datos (Habeas Data)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013, que establecen el Régimen General de Protección de Datos Personales en Colombia, el &quot;Optimizador de Labores Agrícolas&quot; se compromete a proteger tu privacidad y tus datos.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Recolección de Datos:</strong> Al utilizar nuestros servicios, autorizas la recolección de datos personales como tu nombre, correo electrónico, así como la información que registres sobre tus unidades productivas, lotes, labores, personal y finanzas. Esta información es esencial para el funcionamiento de la aplicación.
              </li>
              <li>
                <strong>Uso de la Información:</strong> Tus datos se utilizan exclusivamente para proporcionarte los servicios de la aplicación: almacenar tu información agrícola, realizar cálculos, generar reportes y permitir el análisis con inteligencia artificial. Jamás compartiremos tu información con terceros sin tu consentimiento explícito.
              </li>
              <li>
                <strong>Seguridad:</strong> Utilizamos los servicios de Firebase de Google, una plataforma segura y robusta, para almacenar y proteger tu información. Se implementan reglas de seguridad para asegurar que solo tú, como usuario autenticado, tengas acceso a tus datos.
              </li>
              <li>
                <strong>Derechos del Titular:</strong> Como titular de la información, tienes derecho a conocer, actualizar, rectificar y solicitar la supresión de tus datos. Puedes ejercer estos derechos contactándonos a través de los correos proporcionados en la sección de contacto.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Derechos de Autor y Propiedad Intelectual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              El software &quot;Optimizador de Labores Agrícolas&quot;, incluyendo su código fuente, diseño, interfaces gráficas, logotipos y contenido textual, es propiedad intelectual de sus desarrolladores, Lucas Mateo Tabares Franco y Alfredo García Llano.
            </p>
            <p>
              Queda estrictamente prohibida la reproducción, distribución, modificación o ingeniería inversa total o parcial de esta aplicación sin la autorización previa y por escrito de los titulares de los derechos de autor. El uso no autorizado de este software constituirá una violación de las leyes de propiedad intelectual y dará lugar a las acciones legales correspondientes.
            </p>
            <p>
              &copy; {new Date().getFullYear()} Todos los derechos reservados.
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
              Para soporte técnico, asesoría especializada, consultas sobre la aplicación o propuestas comerciales, no dudes en contactarnos.
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}