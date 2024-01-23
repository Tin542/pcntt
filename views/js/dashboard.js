(function renderChart() {
  $.ajax({
    type: "GET",
    url: `/admin/dashboard/chart`,
    success: function (rs) {
      let data = rs.data;
      console.log("rs", rs);
      const ctx = document.getElementById("myChart");
      new Chart(ctx, {
        type: "bar",
        data: {
          labels: data.map((el) => el.time),
          datasets: [
            {
              label: "Tổng doanh thu trong tháng",
              data: data.map((el) => el.revenue),
              borderWidth: 1,
            },
          ],
        },
      });
    },
  });
})();
(function renderSummary() {
  $.ajax({
    type: "GET",
    url: `/admin/dashboard/summary`,
    success: function (rs) {
      let data = rs.data;
      document.getElementById("revernue").innerHTML = data.revenue;
      document.getElementById("order").innerHTML = data.order;
      document.getElementById("user").innerHTML = data.user;
      document.getElementById("product").innerHTML = data.product;
    },
  });
})();
