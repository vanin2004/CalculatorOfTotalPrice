const STATE = {
  errors: false //presence of errors in the entered data
};

const updateCompanyIndices = () => {
  const cards = document.querySelectorAll(".company-card");
  cards.forEach((card, index) => {
    card.querySelector(".company-index").innerText = "Компания №" + (index + 1);
    card.dataset.index = index;
  });
};

function setTotalPrice() {
  function countFullMonths(startDate,endDate){
    // Calculating the number of months according to the rules
    /*
      ●	Целым месяцем считаем период с дня даты начала расширения до (этого же дня -1) в следующем месяце
      ●	Если в дате начала расширения день равен одному из (29, 30, 31), а в месяце окончания нет такого дня, то считаем окончанием месяца день равный (последний день месяца окончания -1).
      ●	Если в дате начала расширения день равен 1-му числу, то тогда целые месяцы считаем, как количество полных календарных.
    */
    startDate = dayjs(startDate);
    endDate = dayjs(endDate);
    endDate = endDate.add(1,'day')
    let months = endDate.diff(startDate,'month')
    return months;
  }

  if (STATE.errors) {
    // if there are input errors, the final price is not displayed
    document.getElementById("total-price").innerText = "Итог: - ₽";
    return;
  }

  const companyCards = document.querySelectorAll(".company-card");
  // check whether basic or expert tariff is selected
  const is_professional = document.querySelector(".toggle-btn.selected").dataset.value === "extended"; 
  let company_price;

  if (is_professional) {
    if (companyCards.length === 1) { company_price = tariffs.professional.individual; }
    else { company_price = tariffs.professional.group; }
  } else {
    if (companyCards.length === 1) { company_price = tariffs.basic.individual; }
    else { company_price = tariffs.basic.group; }
  }

  let months_company_price_in_kopeks = Math.round((company_price * 100) / 12);
  // the price for the month is calculated from the price for the year, rounded to the nearest kopeck

  let total = 0;
  companyCards.forEach(card => {
    const start_date = new Date(card.querySelector('input[name="start_date[]"]').value);
    const end_date = new Date(card.querySelector('input[name="end_date[]"]').value);
    months = countFullMonths(start_date,end_date);
    total += months_company_price_in_kopeks * months;
  });

  document.getElementById("total-price").innerText = "Итог: " + (total/100).toFixed(2) + " ₽";
}

function validateAll() {
  const companyCards = document.querySelectorAll(".company-card");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  STATE.errors = companyCards.length === 0; // unset error flag if there are company cards

  companyCards.forEach(card => {
    const startInput = card.querySelector('input[name="start_date[]"]');
    const endInput = card.querySelector('input[name="end_date[]"]');
    const innInput = card.querySelector('input[name="inn[]"]');

    const startDate = new Date(startInput.value);
    const endDate = new Date(endInput.value);

    let errors = []; 
    [startInput, endInput, innInput].forEach(input => input.classList.remove("invalid"));

    // check inn
    if (!innInput.value.match(/^\d{10}$/)) {
      errors.push("ИНН должен состоять из 10 цифр.");
      innInput.classList.add("invalid");
    }

    // check start date
    if (startInput.value && startDate < today) {
      errors.push("Дата начала не может быть в прошлом.");
      startInput.classList.add("invalid");
    }

    // check end date
    if (endInput.value && endDate < today) {
      errors.push("Дата окончания не может быть в прошлом.");
      endInput.classList.add("invalid");
    }

    // check start date is before end date
    if (startInput.value && endInput.value && endDate < startDate) {
      errors.push("Дата окончания не может быть раньше даты начала.");
      startInput.classList.add("invalid");
      endInput.classList.add("invalid");
    }

    let uniqueInn = true;
    companyCards.forEach(otherCard => {
      if (otherCard !== card && otherCard.querySelector('input[name="inn[]"]').value === innInput.value) {
        uniqueInn = false;
      }
    });

    if (!uniqueInn) {
      errors.push(`ИНН ${innInput.value} не является уникальным.`);
      startInput.classList.add("invalid");
      endInput.classList.add("invalid");
    }

    // show error messages
    let errorElement = card.querySelector(".error-message");
    if (!errorElement) {
      errorElement = document.createElement("div");
      errorElement.className = "error-message";
      card.appendChild(errorElement);
    }

    if (errors.length > 0) {
      card.classList.add("invalid");
      errorElement.innerHTML = errors.map(e => `• ${e}`).join("<br>");
      STATE.errors = true; // set errors flag to true
    } else {
      errorElement.innerHTML = "";
      card.classList.remove("invalid");
    }
  });
  setTotalPrice();
}

const createCompanyCard = () => {
  const card = document.createElement("div");
  card.classList.add("company-card");

  const lastCard = document.querySelector(".company-card:last-of-type");
  let startDate, endDate;

  if (lastCard) {
    // if there is a last card, take its dates
    startDate = lastCard.querySelector('input[name="start_date[]"]').value;
    endDate = lastCard.querySelector('input[name="end_date[]"]').value;
  } else {
    // set default dates (now and in a year)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    startDate = `${yyyy}-${mm}-${dd}`;

    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);
    const nextYYYY = nextYear.getFullYear();
    const nextMM = String(nextYear.getMonth() + 1).padStart(2, "0");
    const nextDD = String(nextYear.getDate()).padStart(2, "0");
    endDate = `${nextYYYY}-${nextMM}-${nextDD}`;
  }

  card.innerHTML = `
    <div class="company-index">Компания</div>
    <button class="remove-btn" title="Удалить компанию">&times;</button>
    <label>ИНН компании</label>
    <input type="text" name="inn[]" placeholder="Введите ИНН">
    <div class="date-row">
      <div>
        <label>Дата начала</label>
        <input type="date" name="start_date[]" value="${startDate}">
      </div>
      <div>
        <label>Дата окончания</label>
        <input type="date" name="end_date[]" value="${endDate}">
      </div>
    </div>
  `;

  card.querySelector(".remove-btn").addEventListener("click", () => {
    card.remove();
    updateCompanyIndices();
    validateAll();
  });

  card.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", validateAll);
  });

  return card;
};

const addCompanyCard = () => {
  const list = document.getElementById("companies-list");
  const card = createCompanyCard();
  list.appendChild(card);
  updateCompanyIndices();
  validateAll();
};

// init
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("addCompanyBtn").addEventListener("click", addCompanyCard);
  
  document.querySelectorAll(".toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".toggle-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      validateAll();
    });
  });
  addCompanyCard();
  // default card
});