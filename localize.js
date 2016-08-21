(function _attachToClient() {
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = Localize;
    }
    else {
        var scripts = document.getElementsByTagName('script'),
            localizeScript = scripts[scripts.length - 1];
            
        Localize({
            keyword: localizeScript.getAttribute('keyword'),
            path: localizeScript.getAttribute('path'),
            defaultLang: localizeScript.getAttribute('default-lang'),
            init: !(localizeScript.getAttribute('init-loc') && JSON.parse(localizeScript.getAttribute('init-loc')) === false)
        });
    }
})();

function Localize(options) {
    var module = {},
        backupLang = 'en',
        translations = {};

    if (!options) {
        options = {};
    }
    options.keyword = options.keyword || 'translate';
    options.path = options.path || '/translations/';
    options.defaultLang = options.defaultLang || navigator.language || navigator.userLanguage || (navigator.languages ? navigator.languages[0] : backupLang);
    options.init = options.init || true;


    /**
     * Translates the page using the specified language
     * @param {String} lang
     * @returns {Promise}
     */
    module.translate = function(lang) {
      var elems = document.querySelectorAll('[' + options.keyword + ']');

      return getTranslations(lang)
        .then(function(translations) {
          for (var i = 0; i < elems.length; i++) {
            var key = elems[i].getAttribute(options.keyword);
            if (translations[key]) {
              elems[i].innerHTML = translations[key];
            }
          }
          return lang;
        });
    };

    /**
     * @private
     * Retrieve translations object from a JSON file
     * @param {String} lang
     * @returns {Promise}
     */
    function getTranslations(lang) {
      return new Promise(function(resolve, reject) {
        if (translations[lang]){
          module.currentLang = lang;
          resolve(translations[lang]);
          return;
        }

        var xhttp = new XMLHttpRequest();
        xhttp.open("GET", options.path + lang + ".json", true);
        xhttp.send();
        var retry = true;

        xhttp.onreadystatechange = function() {
          if (xhttp.readyState == 4) {
            if (xhttp.status == 404 && retry) {
              if (lang.length > 2) {
                lang = lang.substring(0,2);
                xhttp.open("GET", options.path + lang.substring(0,2) + ".json", true);
                xhttp.send();
                retry = false;
              }
            }
            else if (xhttp.status == 200) {
              translations[lang] = JSON.parse(xhttp.responseText);
              module.currentLang = lang;
              resolve(translations[lang]);
            }
          }
        };

        xhttp.onerror = function() {
          reject(new Error("Error retrieving translations."));
        };
      });
    }

    if (options.init) {
      module.translate(options.defaultLang);
    }

    if (window) {
        window.Localize = module;
    }
    
    return module;
}