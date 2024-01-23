document.addEventListener("DOMContentLoaded", function (event) {
  /*===== LINK ACTIVE =====*/
  const linkColor = document.querySelectorAll(".nav_link");

  console.log(linkColor);

  function colorLink() {
    if (linkColor) {
      linkColor.forEach((l) => l.classList.remove("active-nav"));
      this.classList.add("active-nav");
    }
  }
  linkColor.forEach((l) => l.addEventListener("click", colorLink));

  // Your code to run since DOM is loaded and ready
});
