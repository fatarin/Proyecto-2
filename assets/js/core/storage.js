/* PawLink · acceso seguro a localStorage (puede fallar en modo privado o con datos bloqueados). */
(function (w) {
  var PL = w.PawLink = w.PawLink || {};
  PL.storage = {
    get: function (k, def) { try { var v = localStorage.getItem(k); return v === null ? def : v; } catch (e) { return def; } },
    set: function (k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    remove: function (k) { try { localStorage.removeItem(k); } catch (e) {} },
    getJSON: function (k, def) { try { var v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } },
    setJSON: function (k, v) { return PL.storage.set(k, JSON.stringify(v)); }
  };
})(window);
