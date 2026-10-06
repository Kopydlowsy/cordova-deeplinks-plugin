const path = require("path");
const fs = require("fs");
const plist = require("plist");
const { ConfigParser } = require("cordova-common");

module.exports = function (context) {
  var projectRoot = context.opts.cordova.project
    ? context.opts.cordova.project.root
    : context.opts.projectRoot;
  var configXML = path.join(projectRoot, "config.xml");
  var configParser = new ConfigParser(configXML);

  var app_domain_branded_name = configParser.getGlobalPreference("APP_BRANDED");
  var isBrandedValid =
    app_domain_branded_name &&
    app_domain_branded_name !== "app_branded" &&
    app_domain_branded_name !== "undefined" &&
    app_domain_branded_name !== "none" &&
    app_domain_branded_name.trim() !== "";

  if (isBrandedValid) {
    return; // Se branded for válido, nada a fazer
  }

  var iosPath = path.join(projectRoot, "platforms/ios");
  if (!fs.existsSync(iosPath)) return;

  function cleanPlistFiles(dir) {
    var files = fs.readdirSync(dir);
    files.forEach(function (file) {
      var fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        cleanPlistFiles(fullPath);
      } else if (file.endsWith(".plist") || file.endsWith(".entitlements")) {
        try {
          var content = fs.readFileSync(fullPath, "utf8");
          var obj = plist.parse(content);
          if (
            obj &&
            obj["com.apple.developer.associated-domains"] &&
            Array.isArray(obj["com.apple.developer.associated-domains"])
          ) {
            var domains = obj["com.apple.developer.associated-domains"];
            var filtered = domains.filter(function (d) {
              return (
                !d.includes("app_branded") &&
                !d.includes("$APP_BRANDED") &&
                !d.includes("undefined")
              );
            });
            if (filtered.length !== domains.length) {
              obj["com.apple.developer.associated-domains"] = filtered;
              fs.writeFileSync(fullPath, plist.build(obj));
            }
          }
        } catch (e) {
          // Ignorar se não for um plist/entitlements parseável
        }
      }
    });
  }

  cleanPlistFiles(iosPath);
};
