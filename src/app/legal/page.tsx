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
            <CardTitle>Política de Privacidad y Tratamiento de Datos Personales</CardTitle>
            <CardDescription>Conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013 en Colombia.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Para el **Optimizador de Labores Agrícolas** (en adelante, "la aplicación"), la protección de tu información personal es una prioridad. Esta política describe cómo recolectamos, usamos y protegemos tus datos, en estricto cumplimiento del Régimen General de Protección de Datos Personales de Colombia.
            </p>
            
            <h3 className="font-semibold text-foreground pt-2">1. Responsable del Tratamiento</h3>
            <p>
              Los responsables del tratamiento de tus datos son los desarrolladores de la aplicación, cuyos datos de contacto se encuentran al final de este documento.
            </p>

            <h3 className="font-semibold text-foreground pt-2">2. Autorización y Finalidad del Tratamiento</h3>
            <p>
              Al crear una cuenta y utilizar la aplicación, otorgas tu **autorización expresa, previa e informada** para que recolectemos y tratemos los siguientes datos:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Datos de Identificación:</strong> Nombre, correo electrónico y otros datos proporcionados durante el inicio de sesión con proveedores como Google.
              </li>
              <li>
                <strong>Datos de la Operación Agrícola:</strong> Toda la información que registres voluntariamente en la aplicación, incluyendo, pero no limitándose a, detalles de unidades productivas, lotes, personal, labores, inventario, finanzas y calendarios.
              </li>
            </ul>
            <p>
              La **finalidad** de este tratamiento es exclusivamente la de prestar los servicios inherentes a la aplicación, que consisten en:
            </p>
             <ul className="list-disc space-y-2 pl-5">
              <li>
                Permitir el almacenamiento, gestión y visualización de tu información agrícola.
              </li>
              <li>
                Realizar cálculos de costos, progreso y eficiencia.
              </li>
              <li>
                Generar reportes y análisis (incluyendo el uso de servicios de inteligencia artificial) para optimizar la toma de decisiones.
              </li>
              <li>
                Garantizar el funcionamiento del modo sin conexión y la sincronización de datos con la nube.
              </li>
            </ul>

            <h3 className="font-semibold text-foreground pt-2">3. Derechos del Titular</h3>
            <p>
              Como titular de la información, tienes los siguientes derechos, que puedes ejercer en cualquier momento:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Conocer, Actualizar y Rectificar</strong> tus datos personales.
              </li>
              <li>
                <strong>Solicitar prueba</strong> de la autorización otorgada.
              </li>
              <li>
                <strong>Ser informado</strong> sobre el uso que se le ha dado a tus datos.
              </li>
              <li>
                Presentar quejas ante la Superintendencia de Industria y Comercio por infracciones a la ley.
              </li>
              <li>
                <strong>Revocar la autorización y/o solicitar la supresión</strong> de tus datos cuando no se respeten los principios, derechos y garantías constitucionales y legales.
              </li>
              <li>
                Acceder en forma gratuita a tus datos personales que hayan sido objeto de Tratamiento.
              </li>
            </ul>
            <p>
              Para ejercer estos derechos, puedes contactarnos a través de los correos electrónicos proporcionados en la sección de contacto.
            </p>

            <h3 className="font-semibold text-foreground pt-2">4. Seguridad y Confidencialidad</h3>
            <p>
              La aplicación utiliza la infraestructura tecnológica de Firebase (Google), que cuenta con altos estándares de seguridad. Implementamos medidas técnicas y organizativas, como las reglas de seguridad de Firestore, para garantizar que solo tú, como usuario autenticado, puedas acceder a tu información. Nos comprometemos a no ceder, vender o compartir tus datos con terceros sin tu consentimiento explícito, salvo requerimiento legal de una autoridad competente.
            </p>
            
             <h3 className="font-semibold text-foreground pt-2">5. Vigencia</h3>
            <p>
                La presente política rige a partir de su publicación y los datos serán tratados durante el tiempo que sea razonable y necesario para la finalidad para la cual fueron recabados.
            </p>

          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Derechos de Autor y Propiedad Intelectual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              El software "Optimizador de Labores Agrícolas", incluyendo su código fuente, bases de datos, diseño gráfico, interfaces, textos, logotipos y cualquier otro elemento que lo compone, es una obra protegida por las leyes de derechos de autor de Colombia (Ley 23 de 1982) y las normas de la Comunidad Andina (Decisión 351).
            </p>
            <p>
              La titularidad de los derechos patrimoniales y morales de autor corresponde a sus desarrolladores: **Lucas Mateo Tabares Franco** y **Alfredo García Llano**.
            </p>
            <p>
              Queda estrictamente prohibida la reproducción, copia, distribución, modificación, transformación, ingeniería inversa, descompilación o cualquier otra forma de explotación total o parcial de esta aplicación, con o sin fines de lucro, sin la autorización previa, expresa y por escrito de los titulares. El uso no autorizado constituirá una violación a los derechos de propiedad intelectual y dará lugar a las acciones civiles y penales correspondientes.
            </p>
            <p className="font-semibold">
              &copy; {new Date().getFullYear()} Lucas Mateo Tabares Franco & Alfredo García Llano. Todos los derechos reservados.
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

      </div>
    </div>
  );
}
