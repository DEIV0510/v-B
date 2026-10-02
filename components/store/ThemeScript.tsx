/**
 * Aplica el tema guardado ANTES del primer pintado: es un script en linea y bloqueante, como el
 * de Loader.tsx, no un efecto de React. Si corriera tras la hidratacion, quien eligio modo claro
 * veria un destello negro en cada pagina.
 *
 * Va en el layout de (store) y NO en el raiz a proposito: /admin comparte los tokens de color de
 * globals.css y no debe cambiar de tema. Se marca con un data-attribute (no con una clase)
 * porque <html> ya renderiza className desde app/layout.tsx.
 */
export default function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html:
          "try{if(localStorage.getItem('vb_theme')==='light'){document.documentElement.setAttribute('data-theme','light');var m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content','#ffffff')}}catch(e){}"
      }}
    />
  );
}
