(function (window) {
  const ChrisApp = window.ChrisApp || (window.ChrisApp = {});
  ChrisApp.screens = ChrisApp.screens || {};
  const receipts = ChrisApp.receipts;

  function flashInvalid(input) {
    input.classList.add("is-invalid");
    window.setTimeout(() => {
      input.classList.remove("is-invalid");
    }, 1200);
  }

  function initFormulario(context) {
    const state = context.state;
    const inputs = context.inputs;

    function clearCurrentReceipt() {
      state.currentReceipt = null;
    }

    function syncTextField(fieldName, value) {
      state.form[fieldName] = receipts.sanitizeText(value);
      clearCurrentReceipt();
    }

    inputs.nombre.addEventListener("input", function handleNameInput(event) {
      syncTextField("nombre", event.target.value);
    });

    inputs.concepto.addEventListener("input", function handleConceptInput(event) {
      syncTextField("concepto", event.target.value);
    });

    inputs.monto.addEventListener("input", function handleAmountInput(event) {
      const numericAmount = receipts.parseAmount(event.target.value);
      state.form.montoValue = numericAmount;
      state.form.monto = numericAmount ? receipts.formatCurrency(numericAmount) : "";
      event.target.value = receipts.formatCurrencyInput(event.target.value);
      clearCurrentReceipt();
    });

    inputs.monto.addEventListener("blur", function handleAmountBlur(event) {
      if (!state.form.montoValue) {
        event.target.value = "";
      }
    });

    function fillFormFromState() {
      inputs.nombre.value = state.form.nombre;
      inputs.concepto.value = state.form.concepto;
      inputs.monto.value = state.form.montoValue ? state.form.monto : "";
    }

    function reset() {
      state.form.nombre = "";
      state.form.concepto = "";
      state.form.monto = "";
      state.form.montoValue = 0;
      state.currentReceipt = null;
      fillFormFromState();
    }

    function validateForScreen(screenId) {
      if (screenId === "screen-nombre") {
        const value = receipts.sanitizeText(inputs.nombre.value);

        if (!value) {
          flashInvalid(inputs.nombre);
          inputs.nombre.focus();
          return false;
        }

        state.form.nombre = value;
      }

      if (screenId === "screen-concepto") {
        const value = receipts.sanitizeText(inputs.concepto.value);

        if (!value) {
          flashInvalid(inputs.concepto);
          inputs.concepto.focus();
          return false;
        }

        state.form.concepto = value;
      }

      if (screenId === "screen-monto") {
        const amount = receipts.parseAmount(inputs.monto.value);

        if (!amount) {
          flashInvalid(inputs.monto);
          inputs.monto.focus();
          return false;
        }

        state.form.montoValue = amount;
        state.form.monto = receipts.formatCurrency(amount);
        inputs.monto.value = state.form.monto;
      }

      return true;
    }

    fillFormFromState();

    return {
      validateForScreen,
      fillFormFromState,
      reset
    };
  }

  ChrisApp.screens.formulario = {
    init: initFormulario
  };
})(window);
