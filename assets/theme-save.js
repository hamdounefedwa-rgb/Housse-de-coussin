/* Ajaxify.js.liquid */

/*============================================================================

==============================================================================*/
if ((typeof Shopify) === 'undefined') { Shopify = {}; }
const speedfly_version = "4-6";
/*============================================================================
  API Helper Functions
==============================================================================*/
function attributeToString(attribute) {
  if ((typeof attribute) !== 'string') {
    attribute += '';
    if (attribute === 'undefined') {
      attribute = '';
    }
  }
  return jQuery.trim(attribute);
}

/*============================================================================
  API Functions
  - Shopify.format money is defined in option_selection.js.   
==============================================================================*/
if ( !Shopify.formatMoney ) {
  Shopify.formatMoney = function(cents, format) {
    var value = '',
        placeholderRegex = /\{\{\s*(\w+)\s*\}\}/,
        formatString = (format || this.money_format);

    if (typeof cents == 'string') {
      cents = cents.replace('.','');
    }

    function defaultOption(opt, def) {
      return (typeof opt == 'undefined' ? def : opt);
    }

    function formatWithDelimiters(number, precision, thousands, decimal) {
      precision = defaultOption(precision, 2);
      thousands = defaultOption(thousands, ',');
      decimal   = defaultOption(decimal, '.');

      if (isNaN(number) || number == null) {
        return 0;
      }

      number = (number/100.0).toFixed(precision);

      var parts   = number.split('.'),
          dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
          cents   = parts[1] ? (decimal + parts[1]) : '';

      return dollars + cents;
    }

    switch(formatString.match(placeholderRegex)[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
    }

    return formatString.replace(placeholderRegex, value);
  };
}

Shopify.onProduct = function(product) {
  // alert('Received everything we ever wanted to know about ' + product.title);
};

Shopify.onCartUpdate = function(cart) {
  // alert('There are now ' + cart.item_count + ' items in the cart.');
};

Shopify.updateCartNote = function(note, callback) {
  var params = {
    type: 'POST',
    url: '/cart/update.js',
    data: 'note=' + attributeToString(note),
    dataType: 'json',
    success: function(cart) {
      if ((typeof callback) === 'function') {
        callback(cart);
      }
      else {
        Shopify.onCartUpdate(cart);
      }
    },
    error: function(XMLHttpRequest, textStatus) {
      Shopify.onError(XMLHttpRequest, textStatus);
    }
  };
  jQuery.ajax(params);
};

Shopify.onError = function(XMLHttpRequest, textStatus) {
  var data = eval('(' + XMLHttpRequest.responseText + ')');
  if (!!data.message) {
    alert(data.message + '(' + data.status  + '): ' + data.description);
  } else {
    alert('Error : ' + Shopify.fullMessagesFromErrors(data).join('; ') + '.');
  }
};

/*============================================================================
  POST to cart/add.js returns the JSON of the line item associated with the added item
==============================================================================*/
Shopify.addItem = function(variant_id, quantity, callback) {
  var quantity = quantity || 1;
  var params = {
    type: 'POST',
    url: '/cart/add.js',
    data: 'quantity=' + quantity + '&id=' + variant_id,
    dataType: 'json',
    success: function(line_item) {
      if ((typeof callback) === 'function') {
        callback(line_item);
      }
      else {
        Shopify.onItemAdded(line_item);
      }
    },
    error: function(XMLHttpRequest, textStatus) {
      Shopify.onError(XMLHttpRequest, textStatus);
    }
  };
  jQuery.ajax(params);
};

/*============================================================================
  POST to cart/add.js returns the JSON of the line item
    - Allow use of form element instead of id
    - Allow custom error callback
==============================================================================*/
Shopify.addItemFromForm = function(form, callback, errorCallback) {
  var params = {
    type: 'POST',
    url: '/cart/add.js',
    data: jQuery(form).serialize(),
    dataType: 'json',
    success: function(line_item) {
      if ((typeof callback) === 'function') {
        callback(line_item, form);
      }
      else {
        Shopify.onItemAdded(line_item, form);
      }
    },
    error: function(XMLHttpRequest, textStatus) {
      if ((typeof errorCallback) === 'function') {
        errorCallback(XMLHttpRequest, textStatus);
      }
      else {
        Shopify.onError(XMLHttpRequest, textStatus);
      }
    }
  };
  jQuery.ajax(params);
};

// Get from cart.js returns the cart in JSON
Shopify.getCart = function(callback) {
  jQuery.getJSON('/cart.js', function (cart, textStatus) {
    if ((typeof callback) === 'function') {
      callback(cart);
    }
    else {
      Shopify.onCartUpdate(cart);
    }
  });
};

// GET products/<product-handle>.js returns the product in JSON
Shopify.getProduct = function(handle, callback) {
  jQuery.getJSON('/products/' + handle + '.js', function (product, textStatus) {
    if ((typeof callback) === 'function') {
      callback(product);
    }
    else {
      Shopify.onProduct(product);
    }
  });
};

// POST to cart/change.js returns the cart in JSON
Shopify.changeItem = function(line, quantity, callback) {
  var params = {
    type: 'POST',
    url: '/cart/change.js',
    data:  'quantity=' + quantity + '&line=' + line,
    dataType: 'json',
    success: function(cart) {
      if ((typeof callback) === 'function') {
        callback(cart);
      }
      else {
        Shopify.onCartUpdate(cart);
      }
    },
    error: function(XMLHttpRequest, textStatus) {
      Shopify.onError(XMLHttpRequest, textStatus);
    }
  };
  jQuery.ajax(params);
};

/*============================================================================
  Ajaxify Shopify Add To Cart
==============================================================================*/
/* var ajaxifyShopify = (function(module, $) {

  'use strict';

  // Public functions
  var init;

  // Private general variables
  var settings, isUpdating, cartInit, $cssTransforms, $cssTransforms3d, $nojQueryLoad, $w, $body, $html;

  // Private plugin variables
  var $formContainer, $btnClass, $wrapperClass, $addToCart, $addToCartProduct, $addToCheckout, $cartCountSelector, $cartCostSelector, $toggleCartButton, $modal, $cartContainer, $modalContainer, $modalOverlay, $closeCart, $callbackData={};

  // Private functions
  var updateCountPrice, modalSetup, showModal, sizeModal, hideModal, reloadPage, loadCartImages, formOverride, itemAddedCallback, itemErrorCallback, cartUpdateCallback, setToggleButtons, buildCart, cartTemplate, adjustCart, adjustCartCallback, createQtySelectors, qtySelectors, scrollTop, toggleCallback, validateQty;

  /*============================================================================
    Initialise the plugin and define global options
  ==============================================================================*/
  
  
  init = function (options) {

    // Default settings
    settings = {
      method: 'modal',
      formSelector: 'form[action^="/cart/add"]',
      addToCartSelector: 'input[type="submit"]',
      cartCountSelector: null,
      cartCostSelector: null,
      toggleCartButton: null,
      btnClass: null,
      wrapperClass: null,
      useCartTemplate: false,
      moneyFormat: '${{amount}}',
      disableAjaxCart: false,
      enableQtySelectors: true,
      onToggleCallback: null
    };
  
    // Override defaults with arguments
    $.extend(settings, options);
  
    // Make sure method is lower case
    settings.method = settings.method.toLowerCase();
   
    // Select DOM elements
    $formContainer     = $(settings.formSelector);
    $btnClass          = settings.btnClass;
    $wrapperClass      = settings.wrapperClass;
    $addToCart         = $formContainer.find(settings.addToCartSelector);
    $addToCartProduct  = $formContainer.find(settings.addToCartSelector);
    $addToCheckout     = $formContainer.find(settings.addToCartSelector);  
    $cartCountSelector = $(settings.cartCountSelector);
    $cartCostSelector  = $(settings.cartCostSelector);
    $toggleCartButton  = $(settings.toggleCartButton);
    $modal             = null;
  
    // CSS Checks
    //$cssTransforms   = Modernizr.csstransforms;
    //$cssTransforms3d = Modernizr.csstransforms3d;
  
    // General Selectors
    $w    = $(window);
    $body = $('body');
    $html = $('html');
  
    // Track cart activity status
    isUpdating = false;
  
    // Check if we can use .load
    $nojQueryLoad = $html.hasClass('lt-ie9');
    if ($nojQueryLoad) {
      settings.useCartTemplate = false;
    }
  
    // Setup ajax quantity selectors on the any template if enableQtySelectors is true
    if (settings.enableQtySelectors) {
      qtySelectors();
    }
  
    // Enable the ajax cart
    if (!settings.disableAjaxCart) {
      // Handle each case add to cart method
      modalSetup();     
       
      
      // Escape key closes cart
      $(document).keyup( function (evt) {
        if (evt.keyCode == 27) {
          hideModal();        
        }
      });
  
      if ( $addToCart.length ) {
        // Take over the add to cart form submit
        formOverride();
      }
          
    }
  
    // Run this function in case we're using the quantity selector outside of the cart
    adjustCart();
  };
  
  updateCountPrice = function (cart) {
    if ($cartCountSelector) {
      $cartCountSelector.html(cart.item_count).removeClass('hidden-count');
  
      if (cart.item_count === 0) {
        $cartCountSelector.addClass('hidden-count');
      }
    }
    if ($cartCostSelector) {
      $cartCostSelector.html(Shopify.formatMoney(cart.total_price, settings.moneyFormat));
    }
  };
  
  modalSetup = function () {
    // Create modal DOM elements with handlebars.js template
    var source   = $("#modalTemplate").html(),
        template = Handlebars.compile(source);
  
    // Append modal and overlay to body
    
    $body.append(template).append('<div id="ajaxifyCart-overlay"></div>');
  
    // Modal selectors
    $modalContainer = $('#ajaxifyModal');
    $modalOverlay   = $('#ajaxifyCart-overlay');
    $cartContainer  = $('#ajaxifyCart');
  
    // Close modal when clicking the overlay
    $modalOverlay.on('click', hideModal);
  
    // Create a close modal button
    $modalContainer.prepend('<button class="ajaxifyCart--close" title="' + "Fermer le panier" + '"><i class="fa fa-times"></i></button>');
    $closeCart = $('.ajaxifyCart--close');
    $closeCart.on('click', hideModal);  
  
       // Update modal position on screen changes
    $(window).on({
      orientationchange: function(e) {
        
        if ($modalContainer.hasClass('is-visible')) {
          // sizeModal('resize');
        }
      }, resize: function(e) {
        // IE8 fires this when overflow on body is changed. Ignore IE8.
        if (!$nojQueryLoad && $modalContainer.hasClass('is-visible')) {
          // sizeModal('resize');
        }
      }
    });
  
    // Toggle modal with cart button
    setToggleButtons();
  };
  
  showModal = function (toggle) {
    $body.addClass('ajaxify-modal--visible');    
   
    // Build the cart if it isn't already there
    if ( !cartInit && toggle ) {
      Shopify.getCart(cartUpdateCallback);
    } else {
      sizeModal();
    }
  };
  
  sizeModal = function(isResizing) {
  
    if (!isResizing) {
      $modalContainer.css('opacity', 0);
    }
  
    // Position modal by negative margin
    $modalContainer.css({     
      'opacity': 1
    });   
    
    
    
    $modalContainer.addClass('is-visible');
  
    toggleCallback({
      'is_visible': true
    });
  };
  
  hideModal = function (e) {
    $body.removeClass('ajaxify-modal--visible');
    if (e) {
      e.preventDefault();
    }
  
    if ($modalContainer) {
      $modalContainer.removeClass('is-visible');
      $body.removeClass('ajaxify-lock');
    }
  
    toggleCallback({
      'is_visible': false
    });
  };
  
  reloadPage = function (e) {
    location.reload();
  };
  
  loadCartImages = function () {
    // Size cart once all images are loaded
    var cartImages = $('img', $cartContainer),
        count = cartImages.length,
        index = 0;
  
    cartImages.on('load', function() {
      index++;
  
      if (index==count) {
        switch (settings.method) {
          case 'modal':
            sizeModal();
            break;
          case 'flip':
          case 'drawer':
            sizeDrawer();
            break;
        }
      }
    });
  };
  
  formOverride = function () {
    $formContainer.submit(function(e) {
      e.preventDefault();
  
      // Add class to be styled if desired
      $addToCart.removeClass('is-added').addClass('is-adding');
  
      // Remove any previous quantity errors
      $('.qty-error').remove();
  
      Shopify.addItemFromForm(e.target, itemAddedCallback, itemErrorCallback);
  
      // Set the flip button to a loading state
      switch (settings.method) {
        case 'flip':
          $flipContainer.addClass('flip--is-loading');
          break;
      }
    }); 
  };
  
  itemAddedCallback = function (product) {
    $addToCart.removeClass('is-adding').addClass('is-added');   
    Shopify.getCart(cartUpdateCallback);
  };
  
  itemErrorCallback = function (XMLHttpRequest, textStatus) {
  
    var data = eval('(' + XMLHttpRequest.responseText + ')');
    if (!!data.message) {
      if (data.status == 422) {
        $formContainer.after('<div class="errors qty-error">'+ data.description +'</div>')
      }
    }
  };
  
  cartUpdateCallback = function (cart) {
    // Update quantity and price
    updateCountPrice(cart);
    buildCart(cart);    
  };
  
  setToggleButtons = function () {
    // Reselect the element in case it just loaded
    $toggleCartButton  = $(settings.toggleCartButton);
  
    if ($toggleCartButton) {
      // Turn it off by default, in case it's initialized twice
      // Toggle the cart, based on the method
      $toggleCartButton.on('click', function(e) {
        e.preventDefault();
  
        if ($modalContainer.hasClass('is-visible') ) {
          hideModal();         
        } else {
          showModal(true);
        }
      });
  
    }
  };
  
  buildCart = function (cart) {
    // Empty cart if using default layout or not using the .load method to get /cart
    if (!settings.useCartTemplate || cart.item_count === 0) {
      $cartContainer.empty();
    }
  
    // Show empty cart
    if (cart.item_count === 0) {
      $cartContainer.append('<div class="cart-mini-empty"><h2>' + "Votre panier est vide." + '</h2><span class="cart--continue-message">' + "Continuez à parcourir notre catalogue \u003ca href=\"\/collections\/all\"\u003eici\u003c\/a\u003e." + '</span><span class="cart--cookie-message">' + "Activer les cookies pour utiliser le panier" + '</span></div>');
      hideModal();
      return        
    }
  
    setTimeout(function() {
      showModal(true);
    }, 300)
  
    // Use the /cart template, or Handlebars.js layout based on theme settings
    if (settings.useCartTemplate) {
      cartTemplate(cart);
      return;
    }
  
    // Handlebars.js cart layout
    var items = [],
        item = {},
        data = {};
  
    var source   = $("#cartTemplate").html(),
        template = Handlebars.compile(source);
  
    // Add each item to our handlebars.js data
    $.each(cart.items, function(index, cartItem) {
  
      var itemAdd = cartItem.quantity + 1,
          itemMinus = cartItem.quantity - 1,
          itemQty = cartItem.quantity + ' x';
  
      /* Hack to get product image thumbnail
       *   - Remove file extension, add _small, and re-add extension
       *   - Create server relative link
      */
      var prodImg = cartItem.image.replace(/(\.[^.]*)$/, "_small$1").replace('http:', '');
      var prodName = cartItem.title.replace(/(\-[^-]*)$/, "");
      var prodVariation = cartItem.title.replace(/^[^\-]*/, "").replace(/-/, "");
  
      // Create item's data object and add to 'items' array
      item = {
        key: cartItem.key,
        line: index + 1, // Shopify uses a 1+ index in the API
        url: cartItem.url,
        img: prodImg,
        name: prodName,
        variation: prodVariation,
        itemAdd: itemAdd,
        itemMinus: itemMinus,
        itemQty: itemQty,
        price: Shopify.formatMoney(cartItem.price, settings.moneyFormat)
      };
  
      items.push(item);
    });
  
    // Gather all cart data and add to DOM
    data = {
      items: items,
      totalPrice: Shopify.formatMoney(cart.total_price, settings.moneyFormat),
      btnClass: $btnClass
    }
    $cartContainer.append(template(data));
   
  
  
    // With new elements we need to relink the adjust cart functions
    adjustCart();
    loadCartImages();       
    // Mark the cart as built
    cartInit = true;
    
    
  };
  
  cartTemplate = function (cart) {
    $cartContainer.load('/cart form[action="/cart"]', function() {
  
      // With new elements we need to relink the adjust cart functions
      adjustCart();
      loadCartImages();
          
  
      // Mark the cart as built
    
      /*function detachAttach(source, destination) {
        console.log('trtrtrt')
        let sourceNode = document.querySelector(source);
        let destinationNode = document.querySelectorAll(destination)[0];
        
        destinationNode.appendChild(sourceNode);
  
        /*let des = sourceNode.cloneNode(true);
        destinationNode.appendChild(des);
        sourceNode.parentElement.removeChild(sourceNode);
      }
  
      setTimeout(() => {
        let isProductUpsells = document.querySelector('.ajaxifyCart--content .product__upsells');
  
        console.log(isProductUpsells);
        console.log('totot')
  
        if(!isProductUpsells) detachAttach('.hidden .product__upsells','.ajaxifyCart--content');
        
      }, 1000)*/
  
      cartInit = true;
      
    });
  
  }
  
  adjustCart = function () {
    // This function runs on load, and when the cart is reprinted
  
    // Create ajax friendly quantity fields and remove links in the ajax cart
    if (settings.useCartTemplate) {
      createQtySelectors();
    }
  
    // Prevent cart from being submitted while quantities are changing
    $body.on('submit', 'form.cart-form', function(evt) {
      if (isUpdating) {
        evt.preventDefault();
      }
    });
  
    // Update quantify selectors
    var qtyAdjust = $('.ajaxifyCart--qty span');
  
    // Add or remove from the quantity
    qtyAdjust.off('click');
    qtyAdjust.on('click', function() {
  
      if (isUpdating) {
        return;
      }
  
      var el = $(this),
          line = el.data('line'),
          qtySelector = el.siblings('.ajaxifyCart--num'),
          qty = parseInt( qtySelector.val() );
  
      qty = validateQty(qty);
  
      // Add or subtract from the current quantity
      if (el.hasClass('ajaxifyCart--add')) {
        qty = qty + 1;
      } else {
        qty = qty <= 0 ? 0 : qty - 1;
      }
  
      // If it has a data-line, update the cart.
      // Otherwise, just update the input's number
      if (line) {
        updateQuantity(line, qty);
      } else {
        qtySelector.val(qty);
      }
  
    });
  
    // Update quantity based on input on change
    var qtyInput = $('.ajaxifyCart--num');
    qtyInput.off('change');
    qtyInput.on('change', function() {
      if (isUpdating) {
        return;
      }
  
      var el = $(this),
          line = el.data('line'),
          qty = el.val();      
  
      // Make sure we have a valid integer
      if( (parseFloat(qty) == parseInt(qty)) && !isNaN(qty) ) {
        // We have a number!
      } else {
        // Not a number. Default to 1.
        el.val(1);
        return;
      }
  
      // If it has a data-line, update the cart
      if (line) {
        updateQuantity(line, qty);
      }
    });
  
    // Highlight the text when focused
    qtyInput.off('focus');
    qtyInput.on('focus', function() {
      var el = $(this);
      setTimeout(function() {
        el.select();
      }, 50);
    });
  
    // Completely remove product
    $('.ajaxifyCart--remove').on('click', function(e) {
      var el = $(this),
          line = el.data('line') || null,
          qty = 0;
  
      // Without a data-line, let the default link action take over
      if (!line) {
        return;
      }
  
      e.preventDefault();
      updateQuantity(line, qty);
    });
  
    function updateQuantity(line, qty) {
      isUpdating = true;
  
      // Add activity classes when changing cart quantities
      if (!settings.useCartTemplate) {
        var row = $('.ajaxifyCart--row[data-line="' + line + '"]').addClass('ajaxifyCart--is-loading');
      } else {
        var row = $('.cart-row[data-line="' + line + '"]').addClass('ajaxifyCart--is-loading');
      }
  
      if ( qty === 0 ) {
        row.addClass('is-removed');
      }
  
      // Slight delay to make sure removed animation is done
      setTimeout(function() {
        Shopify.changeItem(line, qty, adjustCartCallback);        
      }, 150);
      
      setTimeout(function() {       
        if ( qty == 0 ) {
          location.reload();
        }
      }, 300);
      
    }
  
    // Save note anytime it's changed
    var noteArea = $('textarea[name="note"]');
    noteArea.off('change');
    noteArea.on('change', function() {
      var newNote = $(this).val();
  
      // Simply updating the cart note in case they don't click update/checkout
      Shopify.updateCartNote(newNote, function(cart) {});
    });
  
    if (window.Shopify && Shopify.StorefrontExpressButtons) {
      Shopify.StorefrontExpressButtons.initialize();
    }
  };
  
  adjustCartCallback = function (cart) {
  
   if ( cart.item_count === 0 ) {
      return
    }
  
    // Reprint cart on short timeout so you don't see the content being removed
    setTimeout(function() {
      isUpdating = false;
      Shopify.getCart(buildCart);  
     
    }, 150)
  };
  
  createQtySelectors = function() {
    // If there is a normal quantity number field in the ajax cart, replace it with our version
    if ($('input[type="number"]', $cartContainer).length) {
      $('input[type="number"]', $cartContainer).each(function() {
        var el = $(this),
            currentQty = parseInt(el.val());
  
        var itemAdd = currentQty + 1,
            itemMinus = currentQty - 1,
            itemQty = currentQty + ' x';
  
        var source = $("#ajaxifyQty").html(),
            template = Handlebars.compile(source),
            data = {
              line: el.attr('data-line'),
              itemQty: itemQty,
              itemAdd: itemAdd,
              itemMinus: itemMinus
            };
  
        // Append new quantity selector then remove original
        el.after(template(data)).remove();
      });
    }
  
    // If there is a regular link to remove an item, add attributes needed to ajaxify it
    if ($('a[href^="/cart/change"]', $cartContainer).length) {
      $('a[href^="/cart/change"]', $cartContainer).each(function() {
        var el = $(this).addClass('ajaxifyCart--remove');
      });
    }
  };
  
  qtySelectors = function() {
    // Change number inputs to JS ones, similar to ajax cart but without API integration.
    // Make sure to add the existing name and id to the new input element
    var numInputs = $('input[type="number"]');
  
    // Qty selector has a minimum of 1 on the product page
    // and 0 in the cart (determined on qty click)
    var qtyMin = 0;
  
    if (numInputs.length) {
      numInputs.each(function() {
        var el = $(this),
            currentQty = parseInt(el.val()),
            inputName = el.attr('name'),
            inputId = el.attr('id');
  
        var itemAdd = currentQty + 1,
            itemMinus = currentQty - 1,
            itemQty = currentQty;
  
        var source   = $("#jsQty").html(),
            template = Handlebars.compile(source),
            data = {
              key: el.data('id'),
              itemQty: itemQty,
              itemAdd: itemAdd,
              itemMinus: itemMinus,
              inputName: inputName,
              inputId: inputId
            };
  
        // Append new quantity selector then remove original
        el.after(template(data)).remove();
      });
  
      // Setup listeners to add/subtract from the input
      $('.js--qty-adjuster').on('click', function() {
        var el = $(this),
            id = el.data('id'),
            qtySelector = el.siblings('.js--num'),
            qty = parseInt( qtySelector.val() );
  
        var qty = validateQty(qty);
        qtyMin = $body.hasClass('template-product') ? 1 : qtyMin;
  
        // Add or subtract from the current quantity
        if (el.hasClass('js--add')) {
          qty = qty + 1;
        } else {
          qty = qty <= qtyMin ? qtyMin : qty - 1;
        }
  
        // Update the input's number
        qtySelector.val(qty);
      });
  
    }
  };
  
  /*scrollTop = function () {
    if ($body.scrollTop() > 0 || $html.scrollTop() > 0) {
      $('html, body').animate({
        scrollTop: 0
      }, 250, 'swing');
    }
  };*/
  
  toggleCallback = function (data) {
    // Run the callback if it's a function
    if (typeof settings.onToggleCallback == 'function') {
      settings.onToggleCallback.call(this, data);
    }
  };
  
  validateQty = function (qty) {
    if((parseFloat(qty) == parseInt(qty)) && !isNaN(qty)) {
      // We have a valid number!
      return qty;
    } else {
      // Not a number. Default to 1.
      return 1;
    }
  };
  
  module = {
    init: init
  };
  
  return module;
  
  }(ajaxifyShopify || {}, jQuery));

  


/*============================================================================
# TOOLS
==============================================================================*/

Shopify.ScrollToTop = () => {
  const footerPrevElement = document.querySelector('#shopify-section-footer').previousElementSibling;
  const btn = document.getElementById("toTop");
  btn.style.display = "none";

  let observer = new IntersectionObserver(entries => {
    entries[0].isIntersecting ? btn.style.display = "block" : btn.style.display = "none";
  });

  observer.observe(footerPrevElement);
 
  btn.addEventListener('click', () => {
    window.scroll({
      top: 0,     
      behavior: 'smooth'
    });
  });
}

Shopify.ScrollToTop();



Shopify.reloadDesignMode = function(events, fn) {
  events.forEach(function(event) {
    document.addEventListener(event, function() {
      setTimeout(function(){   
        console.log(event);
        fn();
      }, 500); 
    }, false);
  });
}

Shopify.simulateLink = function() {
  let gridImages = document.querySelectorAll('.simulate-link');
  for (let i = 0; i < gridImages.length; i++) {       
    gridImages[i].addEventListener('click', function() {
      let link = gridImages[i].dataset.link;     
      window.location.href = link;        
    });
  }
}    

Shopify.simulateLink();   

Shopify.mailtoFormater = function(){
  var regEx = /(\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*)/;

  $(".site-footer p").filter(function() {
    return $(this).html().match(regEx);
  }).each(function() {
    $(this).html($(this).html().replace(regEx, "<a href=\"mailto:$1\">$1</a>"));
  });
}

document.addEventListener("DOMContentLoaded", function() { 
  Shopify.mailtoFormater();  
});

/*============================================================================
# HEADER
==============================================================================*/

Shopify.onSticky = function(lvl) {

  let stickyElement = document.querySelector('.header-section');
  let parent;
  stickyElement.classList.add('sticky');
  if( lvl === 2) {
    parent = stickyElement.parentElement.parentElement;
  } else {
    parent = stickyElement.parentElement;
  } 
};

if (window.matchMedia("(max-width: 750px)").matches) {
  Shopify.onSticky(2);
}
 
/*============================================================================
# PRODUCT
==============================================================================*/


Shopify.ZoomImage = function() {
  if (window.matchMedia("(min-width: 1024px)").matches) {
    $(document).on('mousemove', '.frame', function(event) {

      var element = {
        width: $(this).width(),
        height: $(this).height()
      };

      var mouse = {
        x: event.pageX,
        y: event.pageY
      };

      var offset = $(this).offset();

      var origin = {
        x: (offset.left + (element.width / 2)),
        y: (offset.top + (element.height / 2))
      };

      var trans = {
        left: (origin.x - mouse.x) / 2,
        down: (origin.y - mouse.y) / 2
      };

      var transform = ("scale(2,2) translateX(" + trans.left + "px) translateY(" + trans.down + "px)");

      $(this).children(".zoom").css("transform", transform);

    });
    $(document).on('mouseleave', '.frame', function() {
      $(this).children(".zoom").css("transform", "none");
    });

  }
}

Shopify.ZoomImage();

Shopify.formDesign = function () {
  
 const forms  = document.querySelectorAll('.form-primary');  
 
  if(forms.length) {

    forms.forEach(form => {
      if(form.getAttribute("data-product-form-layout") == "2") {
        
        let selector = ".selector-wrapper label";
        
      
        if(document.querySelectorAll(selector)) {

          if(form.getAttribute("data-product-form-number") == "true") {

          setTimeout(function() {
            let variantsCount = document.querySelectorAll(selector);        
            if(variantsCount.length > 0) {
              $(selector).each(function(index) {             
                let content = $(this).text();
                $(this).html(`<span class="header-number">${index + 1}</span>${content} : `);
                
              });
            }
            let contentQty = $('.product-form-layout-2 .quantity-selector').eq(0).text();
            $('.product-form-layout-2 .quantity-selector').html(`<span class="header-number">${variantsCount.length + 1}</span>${contentQty} : `);

          }, 1000)

        } 
        }
      } 
    });
   
  } 
}

Shopify.formDesign();
Shopify.reloadDesignMode(["shopify:section:load", "shopify:block:load"], Shopify.formDesign);

Shopify.deliveryDate = function () {
  const containers = [...document.querySelectorAll(".delivery-date")];

  if(containers.length === 0) return

  const container = containers[0];
  let firstDate = container.dataset.deliveryDateFrom;
  let lastDate = container.dataset.deliveryDateTo;
  let isDeliverySaturday = container.dataset.deliveryDateSaturday ? true : false;

  let fromDateTimestamp = new Date().getTime() + 24 * firstDate * 3600 * 1000,      
  fromDateDay = new Date(fromDateTimestamp).getDate(),
  fromDateMonth = new Date(fromDateTimestamp).getMonth() + 1,
  toDateTimestamp = new Date().getTime() + 24 * lastDate * 3600 * 1000,
  toDateDay = new Date(toDateTimestamp).getDate(),       
  toDateMonth = new Date(toDateTimestamp).getMonth() + 1; 

  fromDateMonth = (fromDateMonth < 9 ? '0' : '') + fromDateMonth;
  toDateMonth = (toDateMonth < 9 ? '0' : '') + toDateMonth; 

  const checkIfWe = day => {   
    if(new Date(fromDateTimestamp).getDay() === 6) {
      if(day !== 1) {        
        fromDateDay = fromDateDay + 2;
        toDateDay = toDateDay + 2;    
      } 
    }   
  } 

  isDeliverySaturday ? checkIfWe(1) : checkIfWe(2);   

  document.getElementById("ddFromDate").innerHTML =`${fromDateDay}/${fromDateMonth}`;
  document.getElementById("ddToDate").innerHTML =`${toDateDay}/${toDateMonth}`;  
  container.style.display = 'flex';
}

Shopify.deliveryDate();
Shopify.reloadDesignMode(["shopify:section:load", "shopify:block:load"], Shopify.deliveryDate);

/*

Shopify.VideoPlayer = function() {
 
  const contVideoPlayer = document.querySelector('.video-play');
  if (contVideoPlayer) {
    const videoPlayerBtn = document.querySelector('.product-video-icon');
    const videoPlayer = document.querySelectorAll('.video-play video');

    function showPlayBtn(elem) {
      document.querySelector('.product-video-icon').style.display = "none";
      if (elem.paused == false) {
        document.querySelector('.product-video-icon').style.display = "flex";
      } else {
        document.querySelector('.product-video-icon').style.display = "none";
      }
    }
    function playerVideo1(elem) {
      elem.addEventListener("click", function () {
        showPlayBtn(elem);
      });
    }

    function playerVideo2(elem) {
      elem.addEventListener("click", function () {
        videoPlayer[0].play();
        showPlayBtn(elem);
      });
    }

    playerVideo1(videoPlayer[0]);
    playerVideo2(videoPlayerBtn);
  }

} 

document.addEventListener("DOMContentLoaded", () => {
  Shopify.VideoPlayer();
});

*/

/*============================================================================
# PRODUCT LIST
==============================================================================*/
Shopify.modalForm = function(id) { 
  
  const section = document.querySelector('.featured-collection');
  if(!section) return;
  
  const productsforms = document.querySelectorAll('.grid-product-form');
  const allModals = document.querySelectorAll('.modal-form');
  
  const reset = (elem) => {
    allModals.forEach(function(modal) {      
      modal.classList.remove('show-modal-form');
    }); 
  }

  if(productsforms.length > 0) {
    productsforms.forEach((elem) => {   
    callback(elem); 
    
    });
  }
	
  section.addEventListener('mouseleave', function() {
    setTimeout(() => {
      reset();
    }, 300);
  }); 
  

  function callback(elem) {
  
    const modalForm = elem.querySelector('.modal-form');
    const productWrapperBtn = elem.querySelector('.btn');
    const btnClose = elem.querySelector('.modal-form--close');
    const btnAtc = elem.querySelector('.addToCart');   
    
     ['click', 'mouseover'].forEach(function(event) {     
    
      productWrapperBtn.addEventListener(event, function(e) {
     
        reset();
        modalForm.classList.add('show-modal-form');
        modalForm.style = "block";  
      });
      
     });

    btnAtc.addEventListener('click', function() {
      setTimeout(() => {
        reset();
      }, 1500);  
    }); 

    btnClose.addEventListener('click', function() {
      setTimeout(() => {
        reset();
      }, 300);
    }); 

    
  } 
  
  
}

Shopify.modalForm();

Shopify.collectionUtils = function(id) {  

  const collections = document.querySelectorAll('.featured-collection');
  if(collections.length > 0) {
    collections.forEach((collection) => {
    let section = collection.querySelector('.section-collection');
    callback(section.id); 
    });
  }

  function callback(id) {

    let section = document.getElementById(id); 
    let gridTitlesCrop = document.querySelectorAll(`#${id} .grid-crop-title`);
    let gridTitles = document.querySelectorAll(`#${id} .title-truncate`);
    let gridHeight = section.getAttribute('data-title-height');
    let gridHeightSm = section.getAttribute('data-title-height-sm');
    let titleTruncate = section.getAttribute('data-title-truncate');
    let titleTruncateSm = section.getAttribute('data-title-truncate-sm');
    function truncateString(str, num) {

      if (str.length <= num) {
        return str
      }

      return str.slice(0, num) + '...'
    }

    for(i = 0; i < gridTitles.length; i++) {
      let textTitle = gridTitles[i].textContent;
      let num;
      if(window.matchMedia("(min-width:768px)").matches) {
        num = titleTruncate;
      } 
      else {
        num = titleTruncateSm;
      }
      gridTitles[i].textContent = truncateString(textTitle, num);     
    }

    for(i = 0; i < gridTitlesCrop.length; i++) {
      let titleHeight = gridTitlesCrop[i];
      if(window.matchMedia("(min-width:768px)").matches) {       
        titleHeight.style.minHeight = gridHeight+'px';
      } 
      else {
        titleHeight.style.minHeight = gridHeightSm+'px';
      }   
    }
  }  
}

Shopify.collectionUtils();
Shopify.reloadDesignMode(["shopify:section:load", "shopify:block:load"], Shopify.collectionUtils);

/*============================================================================
# COMPONENTS
==============================================================================*/

/* Generique */

const shopifyHeader = document.getElementById('shopify-section-header');
const shopifyAside = document.querySelector('.sidebar');

if(shopifyAside) shopifyAside.style.top = shopifyHeader.offsetHeight+"px";

Shopify.readMore = function() {
  const divs = document.querySelectorAll('.read-more');
  if(divs.length === 0) {
    return
  }
  divs.forEach(div => {
    let btn = document.createElement('button');
    btn.textContent = "En savoir plus"; 
    btn.classList.add('btn','btn-primary','read-more-btn');
    let parent = div.parentNode; 
    parent.insertBefore(btn, div);
    btn.addEventListener('click', function() {      
      div.classList.toggle('show');
      btn.classList.toggle('active');
      if(div.classList.contains('show')) {
        btn.textContent = "En savoir moins";
      } else {
        btn.textContent = "En savoir plus"; 
      }
    });    
  });
}

Shopify.readMore();

Shopify.accordion = function(a, p, opt) {
  const faqs = document.querySelectorAll('.faq');
  const acc = document.querySelectorAll('.panel-heading');
  const panel = document.querySelectorAll('.panel-collapse');

  if (!faqs.length) {
    return;
  }
  
  for (let i = 0; i < acc.length; i++) {
    acc[i].onclick = function() {      
      let setClasses = !this.classList.contains("active");
      setClass(acc, "active", "remove");
      setClass(panel, "in", "remove");  
      if (setClasses) {
        this.classList.toggle("active");
        this.nextElementSibling.classList.toggle("in");
      }
    };
  }
  
  const setClass = (els, className, fnName) => {
    for (let i = 0; i < els.length; i++) {
      if(!opt) els[i].classList[fnName](className);
    }
  }  
};

Shopify.accordion();
Shopify.reloadDesignMode(["shopify:section:load", "shopify:block:load"], Shopify.accordion);
  
Shopify.accordeonMobile = function(selector, opacity) {
  const panelTitles = document.querySelectorAll(selector);
  for (let i = 0; i < panelTitles.length; i++) {
    const panelTitle = panelTitles[i];
    panelTitle.classList.add("accordeon-panel-title");
    const addChevron = '<i class="fa fa-chevron-down"></i>';
    panelTitle.insertAdjacentHTML('beforeend', addChevron);
    const panelContent = panelTitles[i].nextElementSibling;
    panelContent.classList.add("accordeon-panel-hidden");   
    panelTitle.addEventListener("click", function() {    
      panelContent.classList.toggle("accordeon-panel-show");    
      panelTitle.classList.toggle("accordeon-open"); 
    });
  }
}

if (window.matchMedia("(max-width: 600px)").matches) {
    
} 

/* Product */

const serialize = (data) => {
  let obj = {};
  for (let [key, value] of data) {
    if (obj[key] !== undefined) {
      if (!Array.isArray(obj[key])) {
        obj[key] = [obj[key]];
      }
      obj[key].push(value);
    } else {
      obj[key] = value;
    }
  }
  return obj;
}

Shopify.addProduct = function (formsClass, btnClass) {

  let forms = document.querySelectorAll(formsClass);

  if(!forms.length > 0) return

  forms.forEach(form => {
    let btn = form.querySelector(btnClass);
    btn.addEventListener('click', (e) => {      
      e.preventDefault();
      addItem(form);
    });
  })

  const addItem = async (form) => {

    data = new FormData(form);
    let formObj = serialize(data);
  
    let addData = {
      'id':formObj.id,
      'quantity':formObj.quantity
    };

    await fetch('/cart/add.js', {
      body: JSON.stringify(addData),
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With':'xmlhttprequest'
      },
      method: 'POST'
    }).then(function(response) {
      return response.json();
    }).then(function(json) {
      console.log(json)
    }).catch(function(err) {
      console.error(err)
    });
  }
  
}

Shopify.addProduct('.addToCartForm','.btn-atc');

Shopify.productTabs = function () {
  const tabs = document.querySelectorAll('.tabs');

  if(tabs.length) {
  
    jQuery(tabs).each(function(){
      var active, content, links = $(this).find('a');
      if($(this).attr('data-active') == "false") {
        active = links.first().addClass('active');
      } 
      else {
        active = links.first().removeClass('active');
        $('#tab-1').hide();
      }
      
      content = $(active.attr('href'));
      links.not(':first').each(function () {
        $($(this).attr('href')).hide();
      });
      $(this).find('a').click(function(e){
        active.removeClass('active');
        content.hide();
        active = $(this);
        content = $($(this).attr('href'));
        active.addClass('active');
        content.show();
        return false;
      });
    });
  }
}

Shopify.productTabs();
Shopify.reloadDesignMode(["shopify:section:load", "shopify:block:load"], Shopify.productTabs);

/* Article */

Shopify.Summary = function() {
  const t = "Sommaire";
  const h = ".rte h2, .rte h3";
  const nb = "3";

  function slugify(str)
{
    str = str.replace(/^\s+|\s+$/g, '');

    // Make the string lowercase
    str = str.toLowerCase();

    // Remove accents, swap ñ for n, etc
    var from = "ÁÄÂÀÃÅČÇĆĎÉĚËÈÊẼĔȆÍÌÎÏŇÑÓÖÒÔÕØŘŔŠŤÚŮÜÙÛÝŸŽáäâàãåčçćďéěëèêẽĕȇíìîïňñóöòôõøðřŕšťúůüùûýÿžþÞĐđßÆa·/_,:;";
    var to   = "AAAAAACCCDEEEEEEEEIIIINNOOOOOORRSTUUUUUYYZaaaaaacccdeeeeeeeeiiiinnooooooorrstuuuuuyyzbBDdBAa------";
    for (var i=0, l=from.length ; i<l ; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    // Remove invalid chars
    str = str.replace(/[^a-z0-9 -]/g, '') 
    // Collapse whitespace and replace by -
    .replace(/\s+/g, '-') 
    // Collapse dashes
    .replace(/-+/g, '-'); 

    return str;
}

  const wrapper = document.querySelector('.summary');
  if(!wrapper) {
    return;
  }
  const titles = document.querySelectorAll(h);
 
  if (titles.length <= nb) {
    wrapper.style.display = "none";
    return          
  }
  
  let arrayTitles = [];  
  let i;
  // on boucle pour ajouter des ids différents et récupérer le texte des titres              
  for(i=0; i < titles.length; i++){
    const title = titles[i];
    const slug = slugify(title.textContent);
    title.id = `${slug}`;
    arrayTitles.push({
      tag: title.tagName,
      title: title.textContent
    });         
  }              
  // on crée le sommaire    
  const summaryWrapper = document.createElement('div');
  summaryWrapper.id = "summary";          
  const summaryTitle = document.createElement('strong');
  summaryTitle.textContent = t;
  summaryWrapper.appendChild(summaryTitle);
  const btnClose = document.createElement('button');
  btnClose.innerHTML = `<i class="fa fa-bars"></i>`;
  btnClose.classList.add("btn-close");
  summaryWrapper.appendChild(btnClose);
  const ul = document.createElement('ul');
  ul.classList.add("summary-list");
  summaryWrapper.appendChild(ul);
  // on récupère le texte des titres et on crée la liste à puce
  for(i=0; i < arrayTitles.length; i++){            
    const linkTitle = arrayTitles[i].title;                 
    const addLi = document.createElement('li');        
    const insertLi = ul.appendChild(addLi);
    const createLink = document.createElement('a');
    const hrefSlug = slugify(linkTitle);
    createLink.href = `#${hrefSlug}`;            
    const insertLink = insertLi.appendChild(createLink);
    if(arrayTitles[i].tag === "H2") {
      insertLink.innerHTML = `${linkTitle}`; 
    } else {
      insertLink.innerHTML = `<span style="padding-left:1rem;font-size:12px;">${linkTitle}</span>`; 
    }
  }

 
  wrapper.append(summaryWrapper); 

  const links = document.querySelectorAll('.summary .summary-list a');
  const headerHeight = document.querySelector('.header-wrapper').clientHeight;
  let id, title, titleHeight;
  links.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      id = link.href.split('#');
      title = document.getElementById(id[1]);
      if (window.matchMedia("(max-width: 749px)").matches) {
        titleHeight = title.offsetTop - 15;
      } else {
       titleHeight = title.offsetTop + title.offsetHeight;
      }     
      window.scroll({
        top: titleHeight,     
        behavior: 'smooth'
      });
    });
  });

  btnClose.addEventListener('click', function() {
    ul.classList.toggle('hide');
  });   
}

Shopify.Summary();
Shopify.reloadDesignMode(["shopify:section:load", "shopify:block:load"], Shopify.Summary);

Shopify.productsInsideArticle = function() { 
  const findAllProductsOnArticle = document.querySelectorAll('[data-product-handle]');
  const url = "https://speedfly-theme.myshopify.com/";

  const createProductForm = (item, product) => {
    let wrapper = document.createElement('div');
    let title = document.createElement('div');

    wrapper.classList.add('component-product-rte');
    title.classList.add('component-product-rte__title');
    
    item.appendChild(wrapper);
    wrapper.innerHTML = `
    <img src="${product.image.src}" style="max-height:100px;" loading="lazyload" alt="" />
    <div class="component-product-rte__title">${product.title}</div>
    <a href="/products/${product.handle}" class="btn btn-primary">Voir le produit</a>
    `;
   
  }

  const getProduct = async (item, handle) => {
    await fetch(`${url}/products/${handle}.json`)
      .then(res => res.json())
      .then((data) => {
      createProductForm(item, data.product);
    }).catch(err => console.error(err));
  }
  
  findAllProductsOnArticle.forEach(item => {
    getProduct(item, item.dataset.productHandle);
  });
};


if(document.querySelector('.template-article')) Shopify.productsInsideArticle();

const cartInsertItem = (variant) => {    
  var datas = {
    'id':variant,
    'quantity':1
  };
  fetch('/cart/add.js', {
    body: JSON.stringify(datas),
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With':'xmlhttprequest'
    },
    method: 'POST'
  }).then(function(response) {
    return response.json();
  }).then(function(json) {
   
    console.log(json)
  }).catch(function(err) {
   
    console.error(err)
  });
}

/*
cartResetItem = function (variant) { 

  let variantId = variant,
      data = `${variantId}:0`,
      dataStringify= JSON.stringify(data),
      datas = JSON.parse(dataStringify);

  console.log(datas);
  
 let cartUpdates = { 30389822554146:1 }

  fetch('/cart/update.js', {
    body: { updates: cartUpdates },
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With':'xmlhttprequest'
    },
    method: 'POST'
  }).then(function(response) {
    return response.json();
  }).then(function(json) {
   
    console.log(json)
  }).catch(function(err) {
   
    console.error(err)
  });
}
*/

/* cart */

Shopify.productUpsell = function() { 
 
  const upsells = [...document.querySelectorAll('.product__upsell')]

  if(!upsells.length === 0) return;

  upsells.forEach(upsell => {
    let form = upsell.querySelector('form'); 
    let img = upsell.querySelector('img')
    let select = upsell.querySelector('select');    
    let btn = upsell.querySelector('button'); 
    callback(select, img);


    /*handleClick(btn);*/
  })  

  function callback(select, img) {
    select.addEventListener('change', (e) => {      
      const [option] = e.target.selectedOptions
      img.src = option.dataset.imgsrc;

    });
   
  }

  /*function handleClick(btn) {
    btn.addEventListener('click', (e) => {      
      e.preventDefault();
      console.log('iiiiii')
    });
  }*/
  
};
Shopify.productUpsell();

class MiniCart extends HTMLElement {
  constructor() { 
    super();
    this.modal = document.querySelector(".mini-cart-modal");
    this.container = document.getElementById("mini-cart__v2");
    this.btns = document.querySelectorAll('form[action="/cart/add"] .btn-atc');
    this.cartCount = document.querySelectorAll('.cart-count');
    this.cartToggle = document.querySelector('.cart-toggle');
    this.showModal = false;
    /*this.getItems();*/
    this.handleAddProduct();
    this.handleClickCartIcon();
  } 

  openModal() { 
    console.log('open modal')
    setTimeout( async () => {
    this.modal.classList.add("open");
    this.container.classList.add("visible");
    }, 300);
  }

  closeModal() {
    console.log('cose modal')       
    this.modal.classList.remove("open");  
    this.container.classList.remove("visible");
  }

  handleClickCloseModal() { 
    let btnClose = document.getElementById("mini-cart-close-modal");
    btnClose.addEventListener('click', (e) => {       
      this.closeModal();
    });
  }

  generateDom(data) {

    const $container = this.container;
    const itemsContainer = $container.querySelector('.mini-cart__items');  
    itemsContainer.innerHTML = '';
    $container.querySelector('.mini-cart__footer-subTotal').innerHTML = '';
    $container.querySelector('.mini-cart__footer-totalDiscount').innerHTML = '';

    if(data.item_count === 0) {  
      $container.querySelector('.mini-cart__header').innerHTML = '';        
      this.handleChangeQty();
      this.cartCount[0].classList.add('hidden-count');
      this.closeModal();
      return
    }; 
    
    // add header
    $container.querySelector('.mini-cart__header').innerHTML = `
    <div class="h3 mb-none">Panier <span class="cart-count">${data.item_count}</span></div>
    <button id="mini-cart-close-modal"><i class="fa fa-times"></i></button>
    `  
  
    this.cartCount[0].textContent = data.item_count;
    this.cartCount[1].textContent = data.item_count;

    // add items    
    console.log(data);   

    data.items.forEach(item => {

      let div = document.createElement('div');
      div.classList.add('mini-cart__item');
      div.dataset.variantId = item.variant_id;
     
      let img = document.createElement('img');
      img.src = item.image;
      img.width = "55";
      img.height = "55";
      div.appendChild(img);

      let divTitle = document.createElement('div')
      divTitle.textContent = item.title;
      divTitle.classList.add('mini-cart__item-title');
      itemsContainer.appendChild(div);
      div.appendChild(divTitle);

      let divQty = document.createElement('div')
      divQty.classList.add('mini-cart__item-qty');
      itemsContainer.appendChild(divQty);
      div.appendChild(divQty);
      divQty.innerHTML = `<span class="cart-qty--minus">-</span></button><input type="number" name="qty" id="qty" min="1" value="${item.quantity}" /><span class="cart-qty--add">+</span>`;

      let divPrices = document.createElement('div')
      divPrices.textContent = Shopify.formatMoney(item.price, moneyFormat);
      divPrices.classList.add('mini-cart__item-prices');
      itemsContainer.appendChild(divPrices);
      div.appendChild(divPrices);

      let btn = document.createElement('button');
      btn.classList.add('mini-cart__remove-item');
      btn.innerHTML = '&times;';
      div.appendChild(btn);

    })

    this.cartCount[0].classList.remove('hidden-count');
    this.cartCount[0].textContent = data.item_count;
    this.cartCount[1].textContent = data.item_count;

    this.handleChangeQty();
    this.handleClickCloseModal();
    
    // add footer
    $container.querySelector('.mini-cart__footer-subTotal').innerHTML = `<div>Sous-total: ${Shopify.formatMoney(data.total_price, moneyFormat)}</div>`;
    if(data.total_discount > 0) {
      $container.querySelector('.mini-cart__footer-totalDiscount').innerHTML = `<div>Economisez: ${Shopify.formatMoney(data.total_discount, moneyFormat)}</div>`;  
    }   
  }

  getItems() {
    setTimeout( async () => {
      await fetch('/cart.js')
      .then(response => response.json())
      .then(data => {
        this.generateDom(data);
      });
    }, 300);
  }

  handleChangeQty() {
    const qtyInputs = document.querySelectorAll('.mini-cart__item-qty input');  
    const btns = document.querySelectorAll('.mini-cart__remove-item');
    qtyInputs.forEach(input => {
      console.log(input.previousElementSibling);
      input.addEventListener('change', (e) => {
        return this.updateItemQty(input.parentNode.parentNode.dataset.variantId, e.target.value);
      });

      input.previousElementSibling.addEventListener('click', (e) => {       
        input.value =  parseInt(input.value) > 1 ? parseInt(input.value) - 1 : 1;
        console.log(input.value)
        return this.updateItemQty(input.parentNode.parentNode.dataset.variantId, input.value);        
      });

      input.nextElementSibling.addEventListener('click', (e) => {       
        input.value = parseInt(input.value) + 1;
        console.log(input.value)
        return this.updateItemQty(input.parentNode.parentNode.dataset.variantId, input.value);        
      });
    });

    btns.forEach(btn => {     
      btn.addEventListener('click', (e) => {
        return this.updateItemQty(btn.parentNode.dataset.variantId, 0);
      });      
    });
  }

  async updateItemQty(id, qty){ 
    console.log('updateItem')
    await fetch('/cart/change.js', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({ quantity: qty, id: id})
    }).then(function (data) {
      if (!data.status == 200) {
        console.error('Request returned an error', data)
      }
 
    })
    .catch(function (error) {
      console.error('Request failed', error)
    });
    this.getItems();    
  }


  handleAddProduct() {
    this.btns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.getItems();
        this.openModal();
      });
    })
  }

  handleClickCartIcon() {
    this.cartToggle.addEventListener('click', (e) => {
      e.preventDefault();
      this.getItems();
      this.openModal();
      
     });
  }

  
     
}

customElements.define('mini-cart', MiniCart);



/*============================================================================
# SLIDERS - SLICK
==============================================================================*/

Shopify.slider = function() {

  function callbackSlider(id, settings) {
 
    jQuery('#'+id).not('.slick-initialized').slick({ 
      infinite: true,
      slidesToShow: settings.nbDesktop,
      slidesToScroll: 1,
      adaptiveHeight: false,
      dots: false,   
      lazyLoad: "progressive",              
      speed: 300,     
      responsive: [   
        {
          breakpoint: 900,
          settings: {
            slidesToShow: settings.nbDesktop,
            slidesToScroll: 1
          }
        },
        {
          breakpoint: 600,
          settings: {
            slidesToShow: settings.nbDesktop,
            slidesToScroll: 1
          }
        },
        {
          breakpoint: 480,
          settings: {
            slidesToShow: settings.nbMobile,
            slidesToScroll: 1,        
            centerMode: settings.centerMode,
            centerPadding: '25px'
          }
        }     
      ]  
    });
  }
  const sliders = document.querySelectorAll('.product-list-slider');
  if(sliders.length > 0) {
    sliders.forEach((slider) => {
      let params = slider.getAttribute('data-slider');
   
      const settings = JSON.parse(params);
      callbackSlider(slider.id, settings)
    });
  }

}

Shopify.slider();
Shopify.reloadDesignMode(["shopify:section:load", "shopify:block:load"], Shopify.slider);

Shopify.productSlider = function () {
  
  const slider = document.querySelector('.slider-product');

  if(slider) {
    
    const thumbnails = document.querySelector('.slider-product-thumbnails');
    const thumbnailsLayout = parseInt(slider.getAttribute('data-thumbnails-layout'));
    let thumbnailsNumber = parseInt(slider.getAttribute('data-thumbnails-number'));
  
    if(thumbnailsNumber == "0" || isNaN(thumbnailsNumber)) {   
      thumbnails.style.display = "none";     
      thumbnailsNumber = "1";
    }
    
    jQuery(slider).not('.slick-initialized').slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows:true,    
      asNavFor: thumbnails, 
      pauseOnFocus:false,
      speed: 100,
      lazyLoad: "progressive",
      fade: true,
      cssEase: 'linear'
    });

    if (thumbnailsLayout == "1") {
      jQuery(thumbnails).not('.slick-initialized').slick({
        slidesToShow: thumbnailsNumber,
        slidesToScroll: thumbnailsNumber,
        asNavFor: slider,
        dots: true,
        infinite:false,       
        centerMode: false, 
        focusOnSelect: true,
        arrows:true,
        lazyLoad: "progressive",
        vertical:true,
        adaptiveHeight: true
      });
    }
    else {
      jQuery(thumbnails).not('.slick-initialized').slick({
        slidesToShow: thumbnailsNumber,
        slidesToScroll: 1,
        asNavFor: slider,
        dots: true,
        infinite:false,
        arrows:true,
        lazyLoad: "progressive",
        centerMode: false,
        focusOnSelect: true
      });   
    }
  }
}

Shopify.productSlider();
Shopify.reloadDesignMode(["shopify:section:load", "shopify:block:load"], Shopify.productSlider)

Shopify.itemsSlider = function() { 
  
  const sliders = document.querySelectorAll('.slider-items');

  if (sliders.length) {

    sliders.forEach(slider => {
     
      let nbDesktop = parseInt(slider.getAttribute('data-slider-nb-desktop'));
      let nbMobile = parseInt(slider.getAttribute('data-slider-nb-mobile'));

      jQuery(slider).not('.slick-initialized').slick({
        infinite: true,
        slidesToShow: nbDesktop,
        slidesToScroll: nbDesktop,
        dots: false,
        lazyLoad: "progressive",
        speed: 300,
        responsive: [        
          {
            breakpoint: 749,
            settings: {
              slidesToShow: nbMobile,
              slidesToScroll: nbMobile
            }
          }       
        ]
      });

      $(".slick-next:after").click(function () {
        $('.slick-slide').delay(1000).fadeIn(0);
      });
        
    });  

  }

}

Shopify.itemsSlider();
Shopify.reloadDesignMode(["shopify:section:load", "shopify:block:load"], Shopify.itemsSlider);

/*============================================================================
# OPTIMISATION
==============================================================================*/

Shopify.observerIntersectionTools = function(){

  let lazyImages = [].slice.call(document.querySelectorAll(".lazy"));
  let sections = [].slice.call(document.querySelectorAll(".shopify-section"));  
  
  const fadeIn = () => {
    sections.forEach(elem => {
      elem.style.visibility = "hidden";
      elem.style.opacity = "0";
      elem.style.transition = "all 0.3s";
    });
  }

  if ("IntersectionObserver" in window) {
    let lazyImageObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          
          lazyImage.srcset = lazyImage.dataset.srcset;
          lazyImage.classList.remove("lazy");
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });

    lazyImages.forEach(function (lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
    
    let sectionObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          let section = entry.target;          
          let link = section.querySelector('link');
          if(link) {
            section.querySelector('link').setAttribute('media','all');
          }
          /* sectionObserver.unobserve(section); */
        } 
      });
    });

    sections.forEach(function(section) {
      sectionObserver.observe(section);
    });     
  }
}

/* Shopify.observerIntersectionTools(); 

["shopify:section:load", "shopify:section:unload", "shopify:block:load", "shopify:block:unload"].forEach(function(event) {
  document.addEventListener(event, function() {
    setTimeout(function(){    
      Shopify.observerIntersectionTools();      
    }, 300); 
  }, false);
});

*/

/* Experimmental */
/*
document.addEventListener('shopify:section:load', function() {
  container.classList.remove('admin-zone'); 
});

Shopify.simulateAdminZones = function() {  
  const container = document.querySelector(".cont-badges-star");
  if(container) {
    container.classList.add('admin-zone'); 
  } 
  
}

Shopify.reloadDesignMode(["shopify:block:select", "shopify:block:deselect"], Shopify.simulateAdminZones)

*/

/* ================ SLATE ================ */ 
window.theme = window.theme || {};
function _0x57fd(_0x44c3a3,_0x3eb2e9){const _0x472e9a=_0x472e();return _0x57fd=function(_0x57fd32,_0x3096fc){_0x57fd32=_0x57fd32-0x16e;let _0xf6f3e5=_0x472e9a[_0x57fd32];return _0xf6f3e5;},_0x57fd(_0x44c3a3,_0x3eb2e9);}function _0x472e(){const _0xa9289c=['center','7472tAxEjq','right','display','important','T/kgdHJvdXZlciBtYSBsaWNlbmNl','80zIqucS','add','position','innerHTML','EUR','VmV1aWxsZXogcmVuc2VpZ25lciB2b3RyZSBudW3pcm8gZGUgbGljZW5jZSBkYW5zIGwnYXBwbGljYXRpb24gU3BlZWQgRWNvbSBhZmluIGRlIGTpYmxvcXVlciB2b3RyZSB0aOhtZS4gVm91cyDqdGVzIGVuIHZlcnNpb24gZCdlc3NhaSA/IFZvdHJlIG51belybyBkZSBsaWNlbmNlIHZvdXMgc2VyYSBlbnZveekg4CBsYSBmaW4gZGUgY2V0dGUgcOlyaW9kZS4=','block','#FFFFFF','theme','</a>\x20-\x20<a\x20href=\x22https://speed-ecom.eu/speedfly-licence\x22\x20target=\x22_blank\x22>','left','textAlign','none','createElement','2700891SYuNPm','.sf-th-v--close','.sf-th-v','Q29tbWVudCBhY3RpdmVyIG1hIGxpY2VuY2U=','</a>','button','30%','208530WkfhaD','<a\x20href=\x22https://speed-ecom.eu/mon-compte/downloads/\x22\x20target=\x22_blank\x22>','style','querySelector','backgroundColor','top','getElementById','classList','currency','TGljZW5zZSBub3QgYWN0aXZhdGVk','setProperty','25px','RW4gc2F2b2lyIHBsdXMgc3VyIGxlIHN5c3TobWUgZGUgbGljZW5jZQ==','2964308BbWaMV','append','UGxlYXNlIGVudGVyIHlvdXIgbGljZW5zZSBrZXkgaW4gdGhlIFNwZWVkIEVjb20gYXBwbGljYXRpb24gdG8gdW5sb2NrIHlvdXIgdGhlbWUu','TGljZW5jZSBub24gYWN0aXbpZQ==','5766805sIMgVc','addEventListener','6824536CyEUFK','div','156EGnzGc','appendChild','textContent','length','body','3562884uvCxwQ','19AogzdG','5ZeXuxT','0\x200\x2050px\x20#666','sf-th-v--close','SG93IHRvIGFjdGl2YXRlIHRoZSBsaWNlbnNl','padding'];_0x472e=function(){return _0xa9289c;};return _0x472e();}const _0x9e007f=_0x57fd;(function(_0x5ed5cb,_0x100534){const _0x3cd26e=_0x57fd,_0x55f448=_0x5ed5cb();while(!![]){try{const _0x33cf51=-parseInt(_0x3cd26e(0x199))/0x1*(parseInt(_0x3cd26e(0x1a0))/0x2)+-parseInt(_0x3cd26e(0x177))/0x3+-parseInt(_0x3cd26e(0x18b))/0x4*(parseInt(_0x3cd26e(0x19a))/0x5)+-parseInt(_0x3cd26e(0x193))/0x6*(parseInt(_0x3cd26e(0x17e))/0x7)+-parseInt(_0x3cd26e(0x191))/0x8+-parseInt(_0x3cd26e(0x198))/0x9+-parseInt(_0x3cd26e(0x1a5))/0xa*(-parseInt(_0x3cd26e(0x18f))/0xb);if(_0x33cf51===_0x100534)break;else _0x55f448['push'](_0x55f448['shift']());}catch(_0xa7c15b){_0x55f448['push'](_0x55f448['shift']());}}}(_0x472e,0x6fdd7));const sflc=document[_0x9e007f(0x184)]('sflc')['getAttribute']('data-sflc');if(sflc[_0x9e007f(0x196)]!=0x28&&Shopify[_0x9e007f(0x171)]['sfc']!=0x28){const sfBody=document[_0x9e007f(0x181)](_0x9e007f(0x197)),sfDiv=document[_0x9e007f(0x176)](_0x9e007f(0x192)),sfBtn=document[_0x9e007f(0x176)](_0x9e007f(0x17c)),sfTitle=document['createElement']('h2'),sfText=document[_0x9e007f(0x176)]('p');sfBody[_0x9e007f(0x185)][_0x9e007f(0x1a6)]('sf-tr'),sfDiv[_0x9e007f(0x185)]['add']('sf-th-v'),sfBtn['classList'][_0x9e007f(0x1a6)](_0x9e007f(0x19c)),sfDiv['style'][_0x9e007f(0x182)]=_0x9e007f(0x170),sfDiv['style']['boxShadow']=_0x9e007f(0x19b),sfDiv[_0x9e007f(0x180)]['position']='fixed',sfDiv[_0x9e007f(0x180)][_0x9e007f(0x183)]='30%',sfDiv[_0x9e007f(0x180)][_0x9e007f(0x173)]='35%',sfDiv[_0x9e007f(0x180)]['width']=_0x9e007f(0x17d),sfDiv[_0x9e007f(0x180)][_0x9e007f(0x19e)]=_0x9e007f(0x189),sfDiv[_0x9e007f(0x180)][_0x9e007f(0x174)]=_0x9e007f(0x19f),sfBtn['style'][_0x9e007f(0x1a7)]='absolute',sfBtn[_0x9e007f(0x180)][_0x9e007f(0x183)]='2%',sfBtn[_0x9e007f(0x180)][_0x9e007f(0x1a1)]='2%';const sfLinks=document[_0x9e007f(0x176)]('div');if(Shopify[_0x9e007f(0x186)]['active']==_0x9e007f(0x1a9)){sfTitle[_0x9e007f(0x195)]=atob(_0x9e007f(0x18e)),sfText['textContent']=atob(_0x9e007f(0x16e));const sfLinksText1=atob(_0x9e007f(0x1a4)),sfLinksText2=atob(_0x9e007f(0x17a)),sfLinksText3=atob(_0x9e007f(0x18a));sfLinks[_0x9e007f(0x1a8)]=_0x9e007f(0x17f)+sfLinksText1+'</a>\x20-\x20<a\x20href=\x22https://youtu.be/V39jgoAjD7I?t=201\x22\x20target=\x22_blank\x22>'+sfLinksText2+_0x9e007f(0x172)+sfLinksText3+'</a>';}else{sfTitle[_0x9e007f(0x195)]=atob(_0x9e007f(0x187)),sfText[_0x9e007f(0x195)]=atob(_0x9e007f(0x18d));const sfLinksText1=atob(''),sfLinksText2=atob(_0x9e007f(0x19d)),sfLinksText3=atob('');sfLinks['innerHTML']='<a\x20href=\x22https://www.youtube.com/watch?v=AszVJ9AePl4\x22\x20target=\x22_blank\x22>'+sfLinksText2+_0x9e007f(0x17b);};sfBtn['textContent']='x',sfBody[_0x9e007f(0x18c)](sfDiv),sfDiv['append'](sfTitle),sfDiv[_0x9e007f(0x18c)](sfText),sfDiv[_0x9e007f(0x18c)](sfBtn),sfDiv[_0x9e007f(0x194)](sfLinks),document[_0x9e007f(0x181)]('.sf-th-v')[_0x9e007f(0x180)][_0x9e007f(0x188)](_0x9e007f(0x1a2),_0x9e007f(0x175),_0x9e007f(0x1a3));const sfLcVShow=()=>{const _0x59cb06=_0x9e007f;return document[_0x59cb06(0x181)](_0x59cb06(0x179))[_0x59cb06(0x180)][_0x59cb06(0x188)](_0x59cb06(0x1a2),_0x59cb06(0x16f),_0x59cb06(0x1a3));},sfLcVHide=()=>{const _0x1d1b44=_0x9e007f;document['querySelector'](_0x1d1b44(0x178))[_0x1d1b44(0x190)]('click',()=>{const _0xd6248f=_0x1d1b44;document[_0xd6248f(0x181)](_0xd6248f(0x179))[_0xd6248f(0x180)][_0xd6248f(0x188)](_0xd6248f(0x1a2),_0xd6248f(0x175),_0xd6248f(0x1a3));});};setTimeout(function(){sfLcVShow(),sfLcVHide();},300000);}

theme.Sections = function Sections() {
  this.constructors = {};
  this.instances = [];
  $(document)
  .on('shopify:section:load', this._onSectionLoad.bind(this))
  .on('shopify:section:unload', this._onSectionUnload.bind(this))
  .on('shopify:section:select', this._onSelect.bind(this))
  .on('shopify:section:deselect', this._onDeselect.bind(this))
  .on('shopify:block:select', this._onBlockSelect.bind(this))
  .on('shopify:block:deselect', this._onBlockDeselect.bind(this));
};

theme.Sections.prototype = _.assignIn({}, theme.Sections.prototype, {
  _createInstance: function(container, constructor) {
    var $container = $(container);   
    var id = $container.attr('data-section-id');
    var type = $container.attr('data-section-type');

    constructor = constructor || this.constructors[type];

    if (_.isUndefined(constructor)) {
      return;
    }

    var instance = _.assignIn(new constructor(container), {
      id: id,
      type: type,
      container: container     
    });

    this.instances.push(instance);
  },

  _onSectionLoad: function(evt) {
    var container = $('[data-section-id]', evt.target)[0];
    if (container) {
      this._createInstance(container);
    }
  },

  _onSectionUnload: function(evt) {
    this.instances = _.filter(this.instances, function(instance) {
      var isEventInstance = (instance.id === evt.detail.sectionId);

      if (isEventInstance) {
        if (_.isFunction(instance.onUnload)) {
          instance.onUnload(evt);
        }
      }

      return !isEventInstance;
    });
  },

  _onSelect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onSelect)) {
      instance.onSelect(evt);
    }
  },

  _onDeselect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onDeselect)) {
      instance.onDeselect(evt);
    }
  },

  _onBlockSelect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onBlockSelect)) {
      instance.onBlockSelect(evt);
    }
  },

  _onBlockDeselect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onBlockDeselect)) {
      instance.onBlockDeselect(evt);
    }
  },

  register: function(type, constructor) {
    this.constructors[type] = constructor;

    $('[data-section-type=' + type + ']').each(function(index, container) {
      this._createInstance(container, constructor);
    }.bind(this));
  }
});
function _0x15bb(){const _0x1b798c=['currency','theme','EUR','27544izaQMZ','123432ClpUrO','QWNjZXNzIHRvIHRoZSBjaGVja291dCBpcyBkaXNhYmxlZC4gUGxlYXNlIGFjdGl2YXRlIHlvdXIgbGljZW5zZSB0byB1bmxvY2sgaXQu','forEach','addEventListener','sfc','40ioSRqg','active','895vcioaT','1529INNwns','56ANauQj','1265820hCELUf','TCdhY2PocyBhdSBjaGVja291dCBlc3QgZOlzYWN0aXbpLiBWZXVpbGxleiBhY3RpdmVyIHZvdHJlIGxpY2VuY2UgcG91ciBsZSBk6WJsb3F1ZXIu','querySelectorAll','9514gjuGum','44352HvKxvy','TGVhcm4gbW9yZSBhYm91dCB0aGUgbGljZW5zaW5nIHN5c3RlbSA/','6076044POwRYV','DOMContentLoaded','length','315ttdduS','499177XFcleW','preventDefault','81vdKNjB','209FlqmkL'];_0x15bb=function(){return _0x1b798c;};return _0x15bb();}function _0x3bf0(_0x2fbdef,_0x4a7db9){const _0x15bb75=_0x15bb();return _0x3bf0=function(_0x3bf061,_0x14b2ce){_0x3bf061=_0x3bf061-0x153;let _0x3e9216=_0x15bb75[_0x3bf061];return _0x3e9216;},_0x3bf0(_0x2fbdef,_0x4a7db9);}const _0x1009b7=_0x3bf0;(function(_0x162a11,_0x111d73){const _0x4caf3d=_0x3bf0,_0x18e8f5=_0x162a11();while(!![]){try{const _0x167960=-parseInt(_0x4caf3d(0x16c))/0x1*(-parseInt(_0x4caf3d(0x162))/0x2)+-parseInt(_0x4caf3d(0x168))/0x3*(parseInt(_0x4caf3d(0x154))/0x4)+parseInt(_0x4caf3d(0x15c))/0x5*(-parseInt(_0x4caf3d(0x163))/0x6)+parseInt(_0x4caf3d(0x169))/0x7*(-parseInt(_0x4caf3d(0x15a))/0x8)+-parseInt(_0x4caf3d(0x16b))/0x9*(parseInt(_0x4caf3d(0x15f))/0xa)+parseInt(_0x4caf3d(0x15d))/0xb*(parseInt(_0x4caf3d(0x155))/0xc)+parseInt(_0x4caf3d(0x165))/0xd*(parseInt(_0x4caf3d(0x15e))/0xe);if(_0x167960===_0x111d73)break;else _0x18e8f5['push'](_0x18e8f5['shift']());}catch(_0x2fcd9d){_0x18e8f5['push'](_0x18e8f5['shift']());}}}(_0x15bb,0xb77a8),document[_0x1009b7(0x158)](_0x1009b7(0x166),_0x353a74=>{const _0xf9d55=_0x1009b7;Shopify[_0xf9d55(0x16e)][_0xf9d55(0x159)]=sflc;function _0x4c9f79(){const _0x548353=_0xf9d55;if(Shopify[_0x548353(0x16e)]['sfc'][_0x548353(0x167)]!=0x28){function _0x7f627d(_0x355e41,_0x47aee3){alert(_0x355e41);}const _0x43cb50=document[_0x548353(0x161)]('.go-pay');_0x43cb50[_0x548353(0x157)](_0x146063=>{const _0x315f4c=_0x548353;_0x146063[_0x315f4c(0x158)]('click',function(_0x2e90b6){const _0x558d93=_0x315f4c;_0x2e90b6[_0x558d93(0x16a)]();if(Shopify[_0x558d93(0x16d)][_0x558d93(0x15b)]==_0x558d93(0x153)){let _0x3ccc21=atob(_0x558d93(0x160)),_0xe0bb1c=atob('RW4gc2F2b2lyIHBsdXMgc3VyIGxlIHN5c3TobWUgZGUgbGljZW5jZSA');_0x7f627d(_0x3ccc21,_0xe0bb1c);}else{let _0x1d1370=atob(_0x558d93(0x156)),_0x1003ef=atob(_0x558d93(0x164));_0x7f627d(_0x1d1370,_0x1003ef);}});});}}_0x4c9f79();}));

/* ================ MODULES ================ */
/* eslint-disable no-new */
window.timber = window.timber || {};
timber.cacheSelectors = function () {
  timber.cache = {
    // General
    $html: $('html'),
    $body: $('body'),
    $breadcrumbs: $('.breadcrumb'),

    // Navigation
    $navigation: $('#accessibleNav'),
    $hasDropdownItem: $('.site-nav--has-dropdown'),
    $menuToggle: $('.menu-toggle'),

    // Product Page    
    $productImageWrap: $('#productPhoto'),
    $productImage: $('#productPhotoImg'),
    $thumbImages: $('#productThumbs').find('a.product-photo-thumb'),
    $shareButtons: $('.social-sharing'),

    // Collection Pages
    $collectionFilters: $('#collectionFilters'),
    $advancedFilters: $('.advanced-filters'),
    $toggleFilterBtn: $('#toggleFilters'),

    // Cart Pages
    $emptyCart: $('#EmptyCart'),
    $ajaxCartContainer: $('#ajaxifyCart'),
    cartNoCookies: 'cart--no-cookies',

    // Equal height elements
    $featuredContainer: $('.featured-box').closest('.grid-uniform'),   
    $productGridImages: $('.product-grid-image')
    
    
  };
};

timber.cacheVariables = function () {
  timber.vars = {
    // Breakpoints (from timber.scss.liquid)
    bpLarge: 1024,

    // MediaQueries (from timber.scss.liquid)
    mediaQueryLarge     : 'screen and (min-width: 1024px)',
    isLargeBp : false,
    isTouch: timber.cache.$html.hasClass('supports-touch')
  }
};

timber.init = function () {
 // FastClick.attach(document.body);
  timber.cacheSelectors();
  timber.cacheVariables();

  timber.cache.$html.removeClass('no-js').addClass('js');
  if ('ontouchstart' in window) {
    timber.cache.$html.removeClass('no-touch').addClass('touch');
  }

  timber.initCart();
  
  //timber.equalHeights();
  
  timber.responsiveVideos();
  timber.toggleFilters(); 
   
  
};

timber.accessibleNav = function () {
  var $nav = timber.cache.$navigation,
      $allLinks = $nav.find('a'),
      $topLevel = $nav.children('li').find('a'),
      $parents = $nav.find('.site-nav--has-dropdown'),
      $subMenuLinks = $nav.find('.site-nav--dropdown').find('a'),
      activeClass = 'nav-hover',
      focusClass = 'nav-focus';

  // Mouseenter
  $parents.on('mouseenter', function(evt) {
    var el = $(this);

    /*if (!el.hasClass(activeClass)) {
      evt.preventDefault();
    }*/

    showDropdown($(this));
  });

  $parents.on('mouseleave', function() {
    hideDropdown($(this));
  });

  $subMenuLinks.on('click', function(evt) {
    // Prevent touchstart on body from firing instead of link
    evt.stopImmediatePropagation();
  });

  $allLinks.focus(function() {
    handleFocus($(this));
  });

  $allLinks.blur(function() {
    removeFocus($topLevel);
  });

  // accessibleNav private methods
  function handleFocus (el) {
    var $subMenu = el.next('ul'),
        hasSubMenu = $subMenu.hasClass('site-nav--dropdown') ? true : false,
        isSubItem = $('.site-nav--dropdown').has(el).length,
        $newFocus = null;

    // Add focus class for top level items, or keep menu shown
    if ( !isSubItem ) {
      removeFocus($topLevel);
      addFocus(el);
    } else {
      $newFocus = el.closest('.site-nav--has-dropdown').find('a');
      addFocus($newFocus);
    }
  }

  function showDropdown (el) {
    el.addClass(activeClass);

    setTimeout(function() {
      timber.cache.$body.on('touchstart', function() {
        hideDropdown(el);
      }), {passive: true};
    }, 250);
  }

  function hideDropdown ($el) {
    $el.removeClass(activeClass);
    timber.cache.$body.off('touchstart');
  }

  function addFocus ($el) {
    $el.addClass(focusClass);
  }

  function removeFocus ($el) {
    $el.removeClass(focusClass);
  }
};

timber.responsiveNav = function () {
  $(window).resize(function () {
    
    // Replace original nav items and remove more link
    timber.cache.$navigation.append($('#moreMenu--list').html());
    $('#moreMenu').remove();
    timber.alignMenu();
    timber.accessibleNav();
    
  });
  timber.alignMenu();
  timber.accessibleNav();

};

timber.alignMenu = function () {
  var $nav = timber.cache.$navigation,
      w = -5,
      i = 0;
  wrapperWidth = $nav.outerWidth() - 101,
    menuhtml = '';

  if ( window.innerWidth < timber.vars.bpLarge ) {
    return;
  }

  $.each($nav.children(), function () {
    var $el = $(this);

    // Ignore hidden customer links (for mobile)
    if (!$el.hasClass('large-hide')) {
      w += $el.outerWidth(true);
    }

    if (wrapperWidth == w) {
      menuhtml += $('<div>').append($el.clone()).html();
      $el.remove();

      // Ignore hidden customer links (for mobile)
      if (!$el.hasClass('large-hide')) {
        i++;
      }
    }
  });

  if (wrapperWidth == w) {
    $nav.append(
      '<li id="moreMenu" class="site-nav--has-dropdown">'
      + '<a href="#">' + theme.strings.navigation.more_link + '<span class="icon icon-arrow-down" aria-hidden="true"></span></a>'
      + '<ul id="moreMenu--list" class="site-nav--dropdown">' + menuhtml + '</ul></li>'
    );

    if (i <= 1) {
      // Bail, and replace original nav items
      timber.cache.$navigation.append($('#moreMenu--list').html());
      $('#moreMenu').remove();
    }
  }
};

timber.toggleMenu = function () {
  var $doc = $(document);
  var showDropdownClass = 'show-dropdown';
  var showNavClass = 'show-nav';

  timber.cache.$menuToggle.on('click', function() {
    timber.cache.$html.toggleClass(showNavClass);    
    // Close ajax cart if open (keep selectors live, modal is inserted with JS)
    if ( $('#ajaxifyModal').hasClass('is-visible') ) {
      $('#ajaxifyModal').removeClass('is-visible');
      timber.cache.$html.addClass(showNavClass);
     
    }
    
  });
  
  if (window.matchMedia("(max-width: 1023px)").matches) { 
  function dropDown(elem) {
    var acc = document.getElementsByClassName(elem);
    var i;   

    for (i = 0; i < acc.length; i++) {
      acc[i].addEventListener("click", function() {
        
        if(elem == "level1-title" || elem == "level2-title") {
          var panelBefore = this.nextElementSibling;
          var panel = panelBefore.nextElementSibling;
          panelBefore.classList.toggle("active");
        }
        else {
          this.classList.toggle("active");
          var panel = this.nextElementSibling;  
        }    
        
        if (panel.style.display === "block") {
          panel.style.display = "none";       
        } else {
          panel.style.display = "block";
        }
      });
    }
  }
  dropDown("level1-title");
  dropDown("level1");
  dropDown("level2-title");
  dropDown("level2");
  
  jQuery(document).on('shopify:section:load', function(){
    dropDown("level1-title");
    dropDown("level1");
    dropDown("level2-title");
    dropDown("level2");
  });
  } 
};

timber.initCart = function() {
  if (!timber.cookiesEnabled()) {
    timber.cache.$emptyCart.addClass(timber.cache.cartNoCookies);
    timber.cache.$ajaxCartContainer.addClass(timber.cache.cartNoCookies);
  }
};

timber.cookiesEnabled = function() {
  var cookieEnabled = navigator.cookieEnabled;
  if (!cookieEnabled){
    document.cookie = 'testcookie';
    cookieEnabled = (document.cookie.indexOf('testcookie') !== -1);
  }
  return cookieEnabled;
};

timber.responsiveVideos = function () {
  var $iframeVideo = $('iframe[src*="youtube.com/embed"], iframe[src*="player.vimeo"]');
  var $iframeReset = $iframeVideo.add('iframe#admin_bar_iframe');

  $iframeVideo.each(function () {
    // Add wrapper to make video responsive but not for video sections
    if(!$(this).parent('div.video-wrapper').length) {
      $(this).wrap('<div class="video-wrapper"></div>');
    };
  });

  $iframeReset.each(function () {
    
    this.src = this.src;
  });
};

timber.toggleFilters = function () {
  if ( timber.cache.$collectionFilters.length ) {
    timber.cache.$toggleFilterBtn.on('click', function() {
      timber.cache.$toggleFilterBtn.toggleClass('is-active');
      timber.cache.$collectionFilters.slideToggle(200);

      // Scroll to top of filters if user is down the page a bit
      /*if ( $(window).scrollTop() > timber.cache.$breadcrumbs.offset().top ) {
        $('html, body').animate({
          scrollTop: timber.cache.$breadcrumbs.offset().top
        });
      }*/
    });
  }
};

timber.sortFilters = function () {
  timber.cache.$advancedFilters.each(function () {
    var $el = $(this),
        $tags = $el.find('li'),
        aNumber = /\d+/,
        sorted = false;
    $tags.sort(function (a, b) {
      a = parseInt( aNumber.exec( $(a).text() ), 10 );
      b = parseInt( aNumber.exec( $(b).text() ), 10 );
      if ( isNaN(a)  || isNaN(b) ) {
        return;
      }
      else {
        sorted = true;
        return a - b;
      }
    });
    if (sorted) {
      $el.append($tags);
    }
  });
};

timber.formatMoney = function (val) {

       

  return val;
};

timber.formatSaleTag = function (val) {
  // If not using multiple currencies
  if (moneyFormat.indexOf('money') === -1) {
    // If we use amount
    if ( (moneyFormat.indexOf('{{amount}}') > -1) && (moneyFormat.indexOf('.') === -1) ) {
      // If there are no cents or money amount is more than 10, remove decimals
      if ( (val.indexOf('.00') > -1) || parseInt(val.replace(/[^0-9]/g, ''), 10) > 1000 ) {
        return val.split('.')[0];
      }
    }
    // If we use amount_with_comma_separator
    else if (moneyFormat.indexOf('{{amount_with_comma_separator}}') > -1) {
      // If there are no cents or money amount is more than 10, remove decimals
      if ( (val.indexOf(',00') > -1) || parseInt(val.replace(/[^0-9]/g, ''), 10) > 1000 ) {
        return val.split(',')[0];
      }
    }
  }
  return val;
};

// Initialize Timber's JS on docready
$(timber.init)
/* ================ SECTIONS ================ */ 
window.theme = window.theme || {};

theme.HeaderSection = (function() {

  function Header() {
    timber.cacheSelectors();
    timber.toggleMenu();

    $(window).on('load', timber.responsiveNav).resize();
  }

  return Header;
})();

if(document.querySelector('.slider-section')) {

  theme.Slideshow = (function(el) {    
    this.cache = {
      $slider: $(el),
      sliderArgs: {
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: $(el).data('slider-home-auto'),
        autoplaySpeed: $(el).data('slider-home-rate'),
        infinite: $(el).data('slider-home-infinite'),
        dots: $(el).data('slider-home-dots'),
        lazyLoad: "progressive",
        adaptiveHeight: true        
      }
    }

    if (this.cache.$slider.find('div').length === 1) {
      this.cache.sliderArgs.touch = false;
    }
    //this.cache.$slider.slick(this.cache.sliderArgs)
   this.cache.$slider.not('.slick-initialized').slick(this.cache.sliderArgs)

  });  

  theme.slideshows = theme.slideshows || {};

  theme.SlideshowSection = (function() {

    function SlideshowSection(container) {
      var $container = this.$container = $(container);
      var id = $container.attr('data-section-id');
      var slideshow = this.slideshow = '#slideshow--' + id;
      theme.slideshows[slideshow] = new theme.Slideshow(slideshow);
    }

    return SlideshowSection;

  })();

  theme.SlideshowSection.prototype = _.assignIn({}, theme.SlideshowSection.prototype, {

    onUnload: function() {
      delete theme.slideshows[this.slideshow];
    },

    onBlockSelect: function(evt) {
      !function(t,e){"function"==typeof define&&define.amd?define("ev-emitter/ev-emitter",e):"object"==typeof module&&module.exports?module.exports=e():t.EvEmitter=e()}("undefined"!=typeof window?window:this,function(){function t(){}var e=t.prototype;return e.on=function(t,e){if(t&&e){var i=this._events=this._events||{},n=i[t]=i[t]||[];return-1==n.indexOf(e)&&n.push(e),this}},e.once=function(t,e){if(t&&e){this.on(t,e);var i=this._onceEvents=this._onceEvents||{},n=i[t]=i[t]||{};return n[e]=!0,this}},e.off=function(t,e){var i=this._events&&this._events[t];if(i&&i.length){var n=i.indexOf(e);return-1!=n&&i.splice(n,1),this}},e.emitEvent=function(t,e){var i=this._events&&this._events[t];if(i&&i.length){var n=0,o=i[n];e=e||[];for(var r=this._onceEvents&&this._onceEvents[t];o;){var s=r&&r[o];s&&(this.off(t,o),delete r[o]),o.apply(this,e),n+=s?0:1,o=i[n]}return this}},t}),function(t,e){"use strict";"function"==typeof define&&define.amd?define(["ev-emitter/ev-emitter"],function(i){return e(t,i)}):"object"==typeof module&&module.exports?module.exports=e(t,require("ev-emitter")):t.imagesLoaded=e(t,t.EvEmitter)}(window,function(t,e){function i(t,e){for(var i in e)t[i]=e[i];return t}function n(t){var e=[];if(Array.isArray(t))e=t;else if("number"==typeof t.length)for(var i=0;i<t.length;i++)e.push(t[i]);else e.push(t);return e}function o(t,e,r){return this instanceof o?("string"==typeof t&&(t=document.querySelectorAll(t)),this.elements=n(t),this.options=i({},this.options),"function"==typeof e?r=e:i(this.options,e),r&&this.on("always",r),this.getImages(),h&&(this.jqDeferred=new h.Deferred),void setTimeout(function(){this.check()}.bind(this))):new o(t,e,r)}function r(t){this.img=t}function s(t,e){this.url=t,this.element=e,this.img=new Image}var h=t.jQuery,a=t.console;o.prototype=Object.create(e.prototype),o.prototype.options={},o.prototype.getImages=function(){this.images=[],this.elements.forEach(this.addElementImages,this)},o.prototype.addElementImages=function(t){"IMG"==t.nodeName&&this.addImage(t),this.options.background===!0&&this.addElementBackgroundImages(t);var e=t.nodeType;if(e&&d[e]){for(var i=t.querySelectorAll("img"),n=0;n<i.length;n++){var o=i[n];this.addImage(o)}if("string"==typeof this.options.background){var r=t.querySelectorAll(this.options.background);for(n=0;n<r.length;n++){var s=r[n];this.addElementBackgroundImages(s)}}}};var d={1:!0,9:!0,11:!0};return o.prototype.addElementBackgroundImages=function(t){var e=getComputedStyle(t);if(e)for(var i=/url\((['"])?(.*?)\1\)/gi,n=i.exec(e.backgroundImage);null!==n;){var o=n&&n[2];o&&this.addBackground(o,t),n=i.exec(e.backgroundImage)}},o.prototype.addImage=function(t){var e=new r(t);this.images.push(e)},o.prototype.addBackground=function(t,e){var i=new s(t,e);this.images.push(i)},o.prototype.check=function(){function t(t,i,n){setTimeout(function(){e.progress(t,i,n)})}var e=this;return this.progressedCount=0,this.hasAnyBroken=!1,this.images.length?void this.images.forEach(function(e){e.once("progress",t),e.check()}):void this.complete()},o.prototype.progress=function(t,e,i){this.progressedCount++,this.hasAnyBroken=this.hasAnyBroken||!t.isLoaded,this.emitEvent("progress",[this,t,e]),this.jqDeferred&&this.jqDeferred.notify&&this.jqDeferred.notify(this,t),this.progressedCount==this.images.length&&this.complete(),this.options.debug&&a&&a.log("progress: "+i,t,e)},o.prototype.complete=function(){var t=this.hasAnyBroken?"fail":"done";if(this.isComplete=!0,this.emitEvent(t,[this]),this.emitEvent("always",[this]),this.jqDeferred){var e=this.hasAnyBroken?"reject":"resolve";this.jqDeferred[e](this)}},r.prototype=Object.create(e.prototype),r.prototype.check=function(){var t=this.getIsImageComplete();return t?void this.confirm(0!==this.img.naturalWidth,"naturalWidth"):(this.proxyImage=new Image,this.proxyImage.addEventListener("load",this),this.proxyImage.addEventListener("error",this),this.img.addEventListener("load",this),this.img.addEventListener("error",this),void(this.proxyImage.src=this.img.src))},r.prototype.getIsImageComplete=function(){return this.img.complete&&void 0!==this.img.naturalWidth},r.prototype.confirm=function(t,e){this.isLoaded=t,this.emitEvent("progress",[this,this.img,e])},r.prototype.handleEvent=function(t){var e="on"+t.type;this[e]&&this[e](t)},r.prototype.onload=function(){this.confirm(!0,"onload"),this.unbindEvents()},r.prototype.onerror=function(){this.confirm(!1,"onerror"),this.unbindEvents()},r.prototype.unbindEvents=function(){this.proxyImage.removeEventListener("load",this),this.proxyImage.removeEventListener("error",this),this.img.removeEventListener("load",this),this.img.removeEventListener("error",this)},s.prototype=Object.create(r.prototype),s.prototype.check=function(){this.img.addEventListener("load",this),this.img.addEventListener("error",this),this.img.src=this.url;var t=this.getIsImageComplete();t&&(this.confirm(0!==this.img.naturalWidth,"naturalWidth"),this.unbindEvents())},s.prototype.unbindEvents=function(){this.img.removeEventListener("load",this),this.img.removeEventListener("error",this)},s.prototype.confirm=function(t,e){this.isLoaded=t,this.emitEvent("progress",[this,this.element,e])},o.makeJQueryPlugin=function(e){e=e||t.jQuery,e&&(h=e,h.fn.imagesLoaded=function(t,e){var i=new o(this,t,e);return i.jqDeferred.promise(h(this))})},o.makeJQueryPlugin(),o});

      var $slideshow = $(this.slideshow);
      var $slide = $('.slide--' + evt.detail.blockId);

      var slideIndex = $slide.data('slider-index');
      var $slideImg = $slide.find('img') || $slide.find('svg');

      $slide.imagesLoaded($slideImg,function(){
        $slideshow.slick('slickGoTo', slideIndex);
        //$slideshow.slick('autoPlay', false);      
      });
      
      //$(this.slideshow).slick('autoPlay', $(el).data('slider-home-auto'));
    },

    onBlockDeselect: function() {
      $(this.slideshow).slick('autoPlay', 0);
    }

  });

}
/* eslint-disable no-new */
theme.Product = (function() {
  var defaults = {
    selectors: {
      addToCart: '#addToCart',
      addToCartProduct: '#addToCartProduct',
      productPrice: '#productPrice',
      comparePrice: '#comparePrice',
      addToCartText: '#addToCartText',
      addToCartProductText: '#addToCartProductText',
      addToCheckoutText: '#addToCheckoutText',      
      quantityElements: '.quantity-selector, label + .js-qty',
      optionSelector: 'productSelect',
    }
  };

  function Product(container) {
    var $container = this.$container = $(container);    
    var sectionId = $container.attr('data-section-id');
    var form = document.querySelector('.cont-form');

    this.settings = $.extend({}, defaults, {
      sectionId: sectionId,
      enableHistoryState: true,
      showComparePrice: form.getAttribute('data-show-compare-at-price') || false ,
      stockSetting: form.getAttribute('data-stock') || false,  
      incomingMessage: form.getAttribute('data-incoming-transfer') || false,
      
      selectors: {
        $originalSelectorId: 'productSelect-' + sectionId,
        $addToCart: $('#addToCart'),
        $addToCartProduct: $('#addToCartProduct'),
        $addToCheckout: $('#addToCheckout'),
        $SKU: $('.variant-sku'),
        $productPrice: $('#productPrice-' + sectionId),
        $comparePrice: $('#comparePrice-' + sectionId),
        $addToCartText: $('.addToCartText-' + sectionId),
        $addToCartProductText: $('.addToCartText-' + sectionId),
        $addToCheckoutText: $('#addToCheckoutText-' + sectionId),
        $quantityElements: $('#quantity-selector-' + sectionId),
        $variantQuantity: $('#variantQuantity-' + sectionId),
        $variantIncoming: $('#variantIncoming-' + sectionId),
        unitPriceContainer: '[data-unit-price-container]',
        unitPrice: '[data-unit-price]',
        unitPriceBaseUnit: '[data-unit-price-base-unit]',
        $productImageWrap: $('#productPhoto-' + sectionId),
        $productImage: $('#productPhotoImg-' + sectionId),
        $thumbImages: $('#productThumbs-' + sectionId).find('a.product-photo-thumb'),
      }
      
    });

    // disable history state if on homepage
    if($('body').hasClass('template-index')) {
      this.settings.enableHistoryState = false;
    }

    // Stop parsing if we don't have the product json script tag when loading
    // section in the Theme Editor
    if (!$('#ProductJson-' + sectionId).html()) {
      return;
    }

    // this.productSingleObject = JSON.parse(document.getElementById('ProductJson-' + sectionId).innerHTML);
    
    this.productSingleObject = JSON.parse($('#ProductJson-' + sectionId).html());
    this.addVariantInfo();
    this.init();

    // Pre-loading product images to avoid a lag when a thumbnail is clicked, or
    // when a variant is selected that has a variant image
    /*Shopify.Image.preload(this.productSingleObject.images);*/
  }

  Product.prototype = _.assignIn({}, Product.prototype, {
    
   
    init: function() {
      this.initProductVariant();
      this.addQuantityButtons();
      this.productImageSwitch();
      this.initBreakpoints();
	  
      if (timber.vars.isLargeBp) {
        productImageZoom();
      }
    },

    onUnload: function() {
      this.$container.off(this.settings.sectionId);
    },

    addVariantInfo: function() {
      if (!this.productSingleObject) {
        return;
      }

      if (this.settings.stockSetting === 'false' && this.settings.incomingMessage === 'false'){
        return;
      }

      var variantInfo = JSON.parse($('#VariantJson-' + this.settings.sectionId).html());
      for (var i = 0; i < variantInfo.length; i++) {
        $.extend(this.productSingleObject.variants[i], variantInfo[i]);
      }
    },

    addQuantityButtons: function(){
      if (this.settings.selectors.$quantityElements){
        this.settings.selectors.$quantityElements.show();
       
        this.qtySelectors();
       
      }

    },

    qtySelectors: function() {

      validateQty = function (qty) {
        if((parseFloat(qty) == parseInt(qty)) && !isNaN(qty)) {
          // We have a valid number!
          return qty;
        } else {
          // Not a number. Default to 1.
          return 1;
        }
      };

      // Change number inputs to JS ones, similar to ajax cart but without API integration.
      // Make sure to add the existing name and id to the new input element
      var numInputs = $('input[type="number"]');

      // Qty selector has a minimum of 1 on the product page
      // and 0 in the cart (determined on qty click)
      var qtyMin = 0;

      if (numInputs.length) {
        numInputs.each(function() {
          var el = $(this),
              currentQty = parseInt(el.val()),
              inputName = el.attr('name'),
              inputId = el.attr('id');

          var itemAdd = currentQty + 1,
              itemMinus = currentQty - 1,
              itemQty = currentQty;

          var source   = $("#jsQty").html(),
              template = Handlebars.compile(source),
              data = {
                key: el.data('id'),
                itemQty: itemQty,
                itemAdd: itemAdd,
                itemMinus: itemMinus,
                inputName: inputName,
                inputId: inputId
              };

          // Append new quantity selector then remove original
          el.after(template(data)).remove();
        });

        // Setup listeners to add/subtract from the input
        $('.js--qty-adjuster').on('click', function() {
          var el = $(this),
              id = el.data('id'),
              qtySelector = el.siblings('.js--num'),
              qty = parseInt( qtySelector.val() );

          var qty = validateQty(qty);
          qtyMin = timber.cache.$body.hasClass('template-product') ? 1 : qtyMin;

          // Add or subtract from the current quantity
          if (el.hasClass('js--add')) {
            qty = qty + 1;
          } else {
            qty = qty <= qtyMin ? qtyMin : qty - 1;
          }

          // Update the input's number
          qtySelector.val(qty);
        });

      }
    },

    initBreakpoints: function () {

      var self = this;
      var $container = self.$container;
      self.zoomType = $container.data('zoom-enabled');

    },

    productImageSwitch: function() {
      if (!this.settings.selectors.$thumbImages.length) {
        return;
      }

      var self = this;

      // Switch the main image with one of the thumbnails
      // Note: this does not change the variant selected, just the image
      self.settings.selectors.$thumbImages.on('click', function(evt) {
        evt.preventDefault();
        var newImage = $(this).attr('href');
        var newImageId = $(this).attr('data-image-id');

        self.switchImage(newImage, { id: newImageId }, self.settings.selectors.$productImage);

      });


    },

    switchImage: function (src, imgObject, el) {
      // Make sure element is a jquery object
      var $el = $(el);
      $el.attr('src', src);

      if (this.settings.selectors.$productImage.attr('data-zoom') && timber.vars.isLargeBp) {
        var zoomSrc = src.replace('_compact.','_1024x1024.').replace('_medium.','_1024x1024.').replace('_large.','_1024x1024.');
        $el.attr('data-zoom', zoomSrc);

        $(function() {
          productImageZoom();
        });
      }
    },

    initProductVariant: function() {
      // this.productSingleObject is a global JSON object defined in theme.liquid
      if (!this.productSingleObject) {
        return;
      }   
      
      // $('.selector-wrapper').hide();
      // $('.cont-selector .selector-wrapper').attr('style','display:none');
      var self = this;
    
      this.optionSelector = new Shopify.OptionSelectors(self.settings.selectors.$originalSelectorId, {
        selectorClass: self.settings.selectors.$optionSelectorClass,
        product: self.productSingleObject,
        onVariantSelected: self.productVariantCallback,
        enableHistoryState: self.settings.enableHistoryState,
        settings: self.settings
      });

      // Clean up variant labels if the Shopify-defined
      // defaults are the only ones left
      this.simplifyVariantLabels(this.productSingleObject);

    },

    simplifyVariantLabels: function(productObject) {
      // Hide variant dropdown if only one exists and title contains 'Default'
      if (productObject.variants.length && productObject.variants[0].title.indexOf('Default') >= 0) {
        $('.selector-wrapper').hide();
        $('.cont-selector .selector-wrapper').attr('style','display:none');
      }
      
    },
    

    // **WARNING** This function actually inherits `this` from `this.optionSelector` not
    // from `product` when passed in as a callback for `option_selection.js`
    productVariantCallback: function(variant) {


      
      if (variant) {  
        
        var $unitPriceContainer = $(this.settings.selectors.unitPriceContainer, this.$container);

        $unitPriceContainer.removeClass('product-price-unit--available');

        if (variant.unit_price_measurement) {
          var $unitPrice = $(this.settings.selectors.unitPrice, this.$container);
          var $unitPriceBaseUnit = $(this.settings.selectors.unitPriceBaseUnit, this.$container);

          $unitPrice.text(Shopify.formatMoney(variant.unit_price, moneyFormat));
          //$unitPriceBaseUnit.text(this.getBaseUnit(variant));
          $unitPriceContainer.addClass('product-price-unit--available');
        }
        
        // Update variant image, if one is set
        if (variant.featured_image) {
          var newImg = variant.featured_image,
              el = this.settings.selectors.$productImage[0],
              zoomSrc = $(newImg).attr('src').replace('.jpg','_1024x1024.jpg').replace('.jpeg','_1024x1024.jpeg').replace('.png','_1024x1024.png'),
              variantImage = variant.featured_image.src.split('?')[0].replace(/http(s)?:/,''),
              $zoomImg = $('.zoomImg');
          
        
          let nbVisits = document.querySelector('.section-product-single').getAttribute('data-first-variant-image');
          var templates = $('div').find("[data-section-slider-id]");
          
          if(nbVisits > 0) {}
            for(let s=0; s < templates.length; s++) {
              var sliderId = "#"+$(templates[s]).attr('id'); 
             
              var medias = $(sliderId+ ' .slider-product div').find("[data-media]");               
            
              for(i=0; i < medias.length; i++) {
                let slideActif = $(sliderId+ " .slider-product").find("[data-media-src='" + variantImage + "']");
				        if(slideActif) { 
                 
                  let slideActifSelected = slideActif.attr('data-slick-index'); 
                 
                  if(slideActifSelected !== undefined ) {
                    
                    $(sliderId+ ' .slider-product').slick('slickGoTo',slideActifSelected);
                  }
                  else {
                    //$(sliderId+ ' .slider-product').slick('slickGoTo',slideActifSelected);
                    // $(sliderId+ ' .slider-product').slick('slickGoTo',0);
                  }               
                } 
              }
            }            
          
          
          /*$('.single-option-selector').change(function() { 
          Shopify.Image.switchImage(newImg, el, this.switchImage);
          });        
          
          Shopify.Image.switchImage(newImg, el, this.switchImage);*/

          if (this.settings.selectors.$productImage.attr('data-zoom') && timber.vars.isLargeBp) {
            // reint zoom attributes on image variant
            this.settings.selectors.$productImage.attr('data-zoom', zoomSrc);
            $zoomImg.attr('src', zoomSrc);
          }
        }


        if (variant.available) {
          
          // We have a valid product variant, so enable the submit button
          this.settings.selectors.$addToCart.removeClass('disabled').prop('disabled', false);
          this.settings.selectors.$addToCartText.html("Ajouter au panier");
          this.settings.selectors.$addToCartProduct.removeClass('disabled').prop('disabled', false);
          this.settings.selectors.$addToCartProductText.html("Ajouter au panier");
          this.settings.selectors.$addToCheckout.removeClass('disabled').prop('disabled', false);
          this.settings.selectors.$addToCheckoutText.html("Acheter maintenant");

          this.settings.selectors.$variantQuantity.removeClass('is-visible');
          this.settings.selectors.$variantIncoming.removeClass('is-visible');

          if (variant.inventory_management) {
            // Show how many items are left, if below 10
            if (variant.inventory_quantity < 10 && variant.inventory_quantity > 0 && this.settings.stockSetting == 'true') {
              this.settings.selectors.$variantQuantity.html(theme.strings.product.only_left.replace('1', variant.inventory_quantity)).addClass('is-visible');
            }
          }

          // Show next ship date if quantity <= 0 and stock is incoming
          if (variant.inventory_quantity <= 0 && variant.incoming != null ) {
            if (variant.next_incoming_date != null){
              this.settings.selectors.$variantIncoming.html(theme.strings.product.will_be_in_stock_after.replace('[date]', variant.next_incoming_date)).addClass('is-visible');
            }
          }
        } else {    
          
          

          // Variant is sold out, disable the submit button
          this.settings.selectors.$addToCart.addClass('disabled').prop('disabled', true);
          this.settings.selectors.$addToCartText.html("Épuisé");
          this.settings.selectors.$addToCartProduct.addClass('disabled').prop('disabled', true);
          this.settings.selectors.$addToCartProductText.html("Épuisé");
          this.settings.selectors.$addToCheckout.addClass('disabled').prop('disabled', true);
          this.settings.selectors.$addToCheckoutText.html("Épuisé");
          this.settings.selectors.$variantQuantity.removeClass('is-visible');
          this.settings.selectors.$variantIncoming.removeClass('is-visible');

          // Show next stock incoming date if stock is incoming
          if (variant.inventory_management) {
            if (variant.incoming && this.settings.incomingMessage == 'true' && variant.incoming != null && variant.next_incoming_date != null) {
              this.settings.selectors.$variantIncoming.html(theme.strings.product.will_be_in_stock_after.replace('[date]', variant.next_incoming_date)).addClass('is-visible');
            }
          }

          this.settings.selectors.$quantityElements.hide();
        }

        // Regardless of stock, update the product price
        var customPrice = timber.formatMoney( Shopify.formatMoney(variant.price, moneyFormat) );   
        
        var customComparePrice = timber.formatMoney( Shopify.formatMoney(variant.compare_at_price, moneyFormat) ); 
        var a11yPrice = Shopify.formatMoney(variant.price, moneyFormat);
                
        var customPriceWithoutCurrency = "";    
        var customComparePriceWithoutCurrency = "";
        
              
        
        // v1 
        
        var customPriceFormat = ' <span aria-hidden="true" class="so-price" id="so-price" data-compare-price="'+customComparePriceWithoutCurrency+'" data-price="'+customPriceWithoutCurrency+'" data-shipping-value="none" data-discount-qty2="20" data-discount-qty3="30">' + customPrice + '</span>';
         
        
        // v2
         
        
        customPriceFormat += ' <span class="visually-hidden">' + a11yPrice + '</span>';

        // Show SKU
        this.settings.selectors.$SKU.html(variant.sku) 

        if (this.settings.showComparePrice == 'true' ) {
          if (variant.compare_at_price > variant.price) {
            var comparePrice = timber.formatMoney(Shopify.formatMoney(variant.compare_at_price, moneyFormat));
            var a11yComparePrice = Shopify.formatMoney(variant.compare_at_price, moneyFormat);
            
            // v1 
            
            var customPriceFormat = ' <span aria-hidden="true" class="so-price" id="so-price" data-compare-price="'+customComparePriceWithoutCurrency+'" data-price="'+customPriceWithoutCurrency+'" data-shipping-value="none" data-discount-qty2="20" data-discount-qty3="30">' + customPrice + '</span>';
             

            // v2
             
            
            customPriceFormat += ' <span aria-hidden="true"><s>' + comparePrice + '</s></span>';
            customPriceFormat += ' <span class="visually-hidden"><span class="visually-hidden">Prix régulier</span> ' + a11yComparePrice + '</span>';
            customPriceFormat += ' <span class="visually-hidden"><span class="visually-hidden">Prix réduit</span> ' + a11yPrice + '</span>';
             
          }
        }
        
        // special offer v1 - free shipping - discount auto
        
        
        this.settings.selectors.$productPrice.html(customPriceFormat);

        // Also update and show the product's compare price if necessary
        if ( variant.compare_at_price > variant.price ) {
          var priceSaving = Shopify.formatMoney(variant.compare_at_price - variant.price, moneyFormat);
          
          var priceSaving = '<span class="price-sale2"> ' + priceSaving + '</span>';
          var priceSaving2 = timber.formatSaleTag( Shopify.formatMoney(variant.compare_at_price - variant.price, "") );
          var priceSaving2 = ((variant.compare_at_price - variant.price)/variant.compare_at_price*100).toFixed()+"%";
		         
          this.settings.selectors.$comparePrice.html("\u003cspan class='save-text'\u003eEconomisez\u003c\/span\u003e [$]".replace('[$]', priceSaving + " <span class='price-saving-percent'><span class='parentheses'>(</span>-" + priceSaving2 + "<span class='parentheses'>)</span></span>")).show();
                   
        } 
        else {
          this.settings.selectors.$comparePrice.hide();
          
        }
        
        if (variant.compare_at_price == variant.price) {
          
          $('.main-content .amount-percent-true .product-meta .sale-tag').hide();
         
        }       
       

      } else {
        // The variant doesn't exist, disable submit button.
        // This may be an error or notice that a specific variant is not available.
        this.settings.selectors.$addToCart.addClass('disabled').prop('disabled', true);
        this.settings.selectors.$addToCartText.html(theme.strings.product.unavailable);
        this.settings.selectors.$addToCartProduct.addClass('disabled').prop('disabled', true);
        this.settings.selectors.$addToCartProductText.html(theme.strings.product.unavailable);
        this.settings.selectors.$addToCheckout.addClass('disabled').prop('disabled', true);
        this.settings.selectors.$addToCheckoutText.html(theme.strings.product.unavailable);
        this.settings.selectors.$variantQuantity.removeClass('is-visible');
        this.settings.selectors.$quantityElements.hide();
      }

    }

  });

  function productImageZoom() {

    var $productImageWrap = $('.productPhoto'),
        $productImage = $('.productPhotoImg');

    if (timber.vars.isLargeBp) {
      if (!$productImage.attr('data-zoom')) {
        return;
      }

      if (!$productImageWrap.length || timber.cache.$html.hasClass('supports-touch')) {
        return;
      };

      // Destroy zoom (in case it was already set), then set it up again
      $productImageWrap.trigger('zoom.destroy');
      $productImageWrap.addClass('image-zoom').zoom({
        url: $productImage.attr('data-zoom')
      });
    }
  }
  return Product;
})();

var sections = new theme.Sections();
sections.register('slideshow-section', theme.SlideshowSection);
$(document).ready(function() { 
  var sections = new theme.Sections();
  sections.register('header-section', theme.HeaderSection); 
  sections.register('product-template', theme.Product);
});

/* Applications */

/* Size chart */


$(".cont-photos .flex-control-nav").hide();
$('.carousel-inner .item').eq(0).addClass('active');

/* Product form bundle */

document.addEventListener("DOMContentLoaded", function() {
  
  $('.search-bar').hover(function() {
    $( ".search-input" ).focus();
  });

  $(".product-variants option").each(function() {
    var text = $(this).text();
    text = text.replace("Default Title", "Prix");
    $(this).text(text);
});
  
  $(".product-variants2 option").each(function() {
    var text = $(this).text();
    text = text.replace("Default Title", "Prix");
    $(this).text(text);
  });
  
  let moveBtn = document.querySelector('.movearrow');
  if(moveBtn) {
    setTimeout(function() {        
      let sliderHeight = $(".slider-section").height();
      moveBtn.addEventListener('click', function() { 
        window.scroll({
          top: sliderHeight,     
          behavior: 'smooth'
        });
      });
  }, 1000);
  }
  
  
});

/* Header */

document.addEventListener("DOMContentLoaded", function() {
  /* Header cart */
  /* CGV */
  

  $('body').on('click', '[name="checkout"], [name="goto_pp"], [name="goto_gc"]', function() {
    if ($('#agree').is(':checked')) {
      $(this).submit();
    } else {
      alert("Vous devez accepter les conditions générales de vente pour pouvoir passer commande.");
      return false;
    }
  });
  $('body').on('click', '.agree-checkout', function() {
    if ($('#agree2').is(':checked')) {
      $(this).submit();
    } else {
      alert("Vous devez accepter les conditions générales de vente pour pouvoir passer commande.");
      return false;
    }
  });

    

    

});

function checkHeaderSize() {
  const headerHeight = $('.cont-header').height();     
  
  $('.menu-toggle').on('click', function() {     
    
    if ($('html').hasClass('show-nav')) {
      $('.show-nav .nav-bar').attr('style','top:'+headerHeight+'px;padding-bottom:'+headerHeight+'px;'); 
    }
    else {
      $('.nav-bar').attr('style','top:110% !important'); 
    }
  });
}

$(window).on("resize",function(e){ 
 checkHeaderSize();
});

/* Search */

function openSearch() {
  const input = document.querySelectorAll(".search-overlay .search-input");
  document.getElementById("search-overlay").style.display = "block";
  setTimeout(function() {
    input[0].focus();

  }, 600);
}

function closeSearch() {
  document.getElementById("search-overlay").style.display = "none";
}


jQuery(function() {  
  // Current Ajax request.
  var currentAjaxRequest = null;
  // Grabbing all search forms on the page, and adding a .search-results list to each.
  var searchForms = jQuery('form[action="/search"]').css('position','relative').each(function() {
    // Grabbing text input.
    var input = jQuery(this).find('input[name="q"]');
    // Adding a list for showing search results.
    var offSet = input.position().top + input.innerHeight();
    jQuery('<ul class="search-results"></ul>').css( { 'position': 'absolute', 'left': '0px', 'top': '100%' } ).appendTo(jQuery(this)).hide();    
    // Listening to keyup and change on the text field within these search forms.
    input.attr('autocomplete', 'off').bind('keyup change', function() {
      // What's the search term?
      var term = jQuery(this).val() + "*";
      // What's the search form?
      var form = jQuery(this).closest('form');
      // What's the search URL?      
      
      var searchURL = '/search?type=product&q=' + term;
      // What's the search results list?
      var resultsList = form.find('.search-results');
      // If that's a new term and it contains at least 3 characters.
      if (term.length > 3 && term != jQuery(this).attr('data-old-term')) {
        // Saving old query.
        jQuery(this).attr('data-old-term', term);
        // Killing any Ajax request that's currently being processed.
        if (currentAjaxRequest != null) currentAjaxRequest.abort();
        // Pulling results.
        currentAjaxRequest = jQuery.getJSON(searchURL + '&view=json', function(data) {
          // Reset results.
          resultsList.empty();
          // If we have no results.
          if(data.results_count == 0) {
            // resultsList.html('<li><span class="title">No results.</span></li>');
            // resultsList.fadeIn(200);
            resultsList.hide();
          } else {
            // If we have results.
            jQuery.each(data.results, function(index, item) {
              var link = jQuery('<a></a>').attr('href', item.url);
              if (item.thumbnail.includes('no-image')) {
              link.append('<span class="thumbnail"></span>');
              }
              else {
                link.append('<span class="thumbnail"><img src="' + item.thumbnail + '" loading="lazy" width="50" height="50"></span>');
                
              }              
              link.append('<span class="title">' + item.title + '</span>');
              link.wrap('<li></li>');
              resultsList.append(link.parent());
            });
            // The Ajax request will return at the most 10 results.
            // If there are more than 10, let's link to the search results page.
            if(data.results_count > 10) {
              resultsList.append('<li><span class="title"><a href="' + searchURL + '">Voir tous les produits (' + data.results_count + ')</a></span></li>');
            }
            resultsList.fadeIn(200);
          }        
        });
      }
    });
  });
  // Clicking outside makes the results disappear.
  jQuery('body').bind('click', function(){
    jQuery('.search-results').hide();
  });
});

/*
const zoombox = () => {

  const env = 'dev';
  let protocol = "https:";
  if(env === "dev") protocol = "http:";
  
  const slider = document.querySelector(".slider-product");
  if(!slider) return
  const sliderImages = slider.querySelectorAll('.slick-slide');
  const zoomBox = document.querySelector(".zoombox");
  const zoomBoxContent = zoomBox.querySelector(".zoombox__content");  
  const zoomBoxClose = zoomBox.querySelector(".zoombox__close");
  const prev = document.querySelector(".zoombox__prevSlide");
  const next = document.querySelector(".zoombox__nextSlide");

  const generateZoomboxContent = (count) => {
    
    sliderImages.forEach((item) => {
      let elem = item.cloneNode(true);  
      zoomBoxContent.appendChild(elem);      
      elem.removeAttribute("style");
      elem.removeAttribute("class");
      elem.classList.add("zoombox-item");   
      elem.classList.add("is_hidden");     
    });
  }

  generateZoomboxContent();

  const zoomBoxItems = zoomBox.querySelectorAll(".zoombox-item");
  const handleHidden = () => {
    zoomBoxItems.forEach((item) => {        
      item.classList.add("is_hidden");
      item.classList.remove("is_visible");   
    });
  }

  sliderImages.forEach((item, index) => {   
    item.addEventListener('click', () => { 
      count++;
     
      handleHidden();
      let elem = zoomBoxContent.querySelector(`[data-slick-index="${item.dataset.slickIndex}"]`);     
      elem.classList.remove("is_hidden"); 
      elem.classList.add("is_visible");     
      zoomBox.classList.add('active');     
    });
  });

  next.addEventListener('click', () => {   
    let elem = zoomBoxContent.querySelector(`.zoombox .is_visible`);
    if(elem.nextElementSibling) {
      handleHidden();
      elem.nextElementSibling.classList.add('is_visible');
    } 
  });

  prev.addEventListener('click', () => { 
    let elem = zoomBoxContent.querySelector(`.zoombox .is_visible`);
    if(elem.previousElementSibling) {
      handleHidden();
      elem.previousElementSibling.classList.add('is_visible');
    }
  });
  
  zoomBoxClose.addEventListener('click', () => {    
    zoomBox.classList.remove('active');  
  });
}

zoombox();

*/