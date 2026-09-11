(() => {
  const ORIGIN = "https://tempopelotas.com.br";
  const script = document.currentScript;
  if (!(script instanceof HTMLScriptElement)) return;

  const token = script.dataset.widget?.trim();
  if (!token) return;

  const parentHost = window.location.hostname.trim().toLowerCase();
  const iframe = document.createElement("iframe");
  iframe.src = `${ORIGIN}/embed/widget?token=${encodeURIComponent(token)}`;
  iframe.title = script.dataset.title?.trim() || "Widget Tempo Pelotas";
  iframe.loading = "lazy";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.setAttribute("scrolling", "no");
  iframe.style.display = "block";
  iframe.style.width = "100%";
  iframe.style.maxWidth = "100%";
  iframe.style.height = `${Number(script.dataset.height) || 360}px`;
  iframe.style.border = "0";
  iframe.style.overflow = "hidden";
  iframe.style.background = "transparent";

  const applyPresentation = (presentation) => {
    if (presentation === "compact") {
      iframe.style.maxWidth = "420px";
      return;
    }
    if (presentation === "card") {
      iframe.style.maxWidth = "760px";
      return;
    }
    if (presentation === "horizontal") {
      iframe.style.maxWidth = "100%";
    }
  };

  const sendHost = () => {
    if (!parentHost || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage(
      {
        source: "tempo-pelotas-widget-parent",
        token,
        type: "host",
        host: parentHost,
      },
      ORIGIN,
    );
  };

  const onMessage = (event) => {
    if (event.origin !== ORIGIN || event.source !== iframe.contentWindow) return;
    const data = event.data;
    if (!data || data.source !== "tempo-pelotas-widget" || data.token !== token) return;

    if (data.type === "request-host") {
      sendHost();
      return;
    }

    if (data.type !== "resize" || typeof data.height !== "number") return;

    const height = Math.max(120, Math.min(Math.ceil(data.height), 2000));
    iframe.style.height = `${height}px`;
    applyPresentation(data.presentation);
  };

  window.addEventListener("message", onMessage);
  iframe.addEventListener("load", () => {
    iframe.dataset.loaded = "true";
    sendHost();
  });

  script.insertAdjacentElement("afterend", iframe);
})();