const values = [
  {
    symbol: "✓",
    title: "Responsabilidad",
    description:
      "Comprender que nuestras decisiones afectan a todas las personas en la vía.",
    color: "bg-[#E0EFE7] text-[#0F6840]"
  },
  {
    symbol: "◆",
    title: "Respeto",
    description:
      "Reconocer los derechos de conductores, peatones, pasajeros y ciclistas.",
    color: "bg-[#F5C518] text-[#151A1E]"
  },
  {
    symbol: "!",
    title: "Prevención",
    description:
      "Identificar los riesgos antes de que puedan convertirse en un accidente.",
    color: "bg-[#FDE8E9] text-[#A9242B]"
  },
  {
    symbol: "★",
    title: "Aprendizaje",
    description:
      "Mantener actualizados nuestros conocimientos sobre seguridad y tránsito.",
    color: "bg-[#252D32] text-[#FFFFFF]"
  }
];

const valuesContainer = document.querySelector(
  "#values-container"
);

const toast = document.querySelector("#toast");


valuesContainer.innerHTML = values
  .map(
    value => `
      <article
        class="rounded-[0.8rem] border-[0.0625rem]
               border-[#DBE0DC] p-[1rem]"
      >
        <span
          class="grid size-[2.5rem] place-items-center
                 rounded-[0.65rem] font-black ${value.color}"
        >
          ${value.symbol}
        </span>

        <h3 class="mt-[0.75rem] font-extrabold">
          ${value.title}
        </h3>

        <p
          class="mt-[0.35rem] text-[0.78rem]
                 leading-[1.55] text-[#68747B]"
        >
          ${value.description}
        </p>
      </article>
    `
  )
  .join("");


document
  .querySelectorAll("[data-counter]")
  .forEach(counter => {
    const total = Number(
      counter.dataset.counter
    );

    let current = 0;

    const increment = Math.max(
      1,
      Math.ceil(total / 30)
    );

    const timer = setInterval(() => {
      current = Math.min(
        current + increment,
        total
      );

      counter.textContent = current;

      if (current === total) {
        clearInterval(timer);
      }
    }, 30);
  });


document
  .querySelectorAll(".future-view")
  .forEach(button => {
    button.addEventListener("click", () => {
      toast.textContent =
        `La vista ${button.dataset.view} estará disponible próximamente.`;

      toast.classList.remove("hidden");

      clearTimeout(window.toastTimer);

      window.toastTimer = setTimeout(
        () => {
          toast.classList.add("hidden");
        },
        2500
      );
    });
  });