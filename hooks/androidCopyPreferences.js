const et = require("elementtree");
const path = require("path");
const fs = require("fs");
const { ConfigParser } = require("cordova-common");

module.exports = function (context) {
  var projectRoot = context.opts.cordova.project
    ? context.opts.cordova.project.root
    : context.opts.projectRoot;
  var configXML = path.join(projectRoot, "config.xml");
  var configParser = new ConfigParser(configXML);

  var app_domain_name = configParser.getGlobalPreference("APP_HOST");
  var app_domain_branded_name = configParser.getGlobalPreference("APP_BRANDED");

  var isBrandedValid =
    app_domain_branded_name &&
    app_domain_branded_name !== "app_branded" &&
    app_domain_branded_name !== "undefined" &&
    app_domain_branded_name !== "none" &&
    app_domain_branded_name.trim() !== "";

  // ANDROID
  // go inside the AndroidManifest and change value for APP_DOMAIN_NAME
  var manifestPath = path.join(
    projectRoot,
    "platforms/android/app/src/main/AndroidManifest.xml"
  );
  if (fs.existsSync(manifestPath)) {
    var manifestFile = fs.readFileSync(manifestPath).toString();
    var etreeManifest = et.parse(manifestFile);

    // Original App Host
    var dataTags = etreeManifest.findall(
      './application/activity/intent-filter/data[@android:host="app_host"]'
    );
    for (var i = 0; i < dataTags.length; i++) {
      var data = dataTags[i];
      data.set("android:host", app_domain_name);
    }

    // Branded App Host
    var dataTagsBranded = etreeManifest.findall(
      './application/activity/intent-filter/data[@android:host="app_branded"]'
    );
    var intentFilter = etreeManifest.find(
      './application/activity[@android:name="com.cordova.deeplinks.plugin.CustomDeeplinksActivity"]/intent-filter'
    );

    for (var i = 0; i < dataTagsBranded.length; i++) {
      var data_branded = dataTagsBranded[i];
      if (isBrandedValid) {
        data_branded.set("android:host", app_domain_branded_name);
      } else {
        if (intentFilter) {
          intentFilter.remove(data_branded);
        }
      }
    }

    var resultXmlManifest = etreeManifest.write();
    fs.writeFileSync(manifestPath, resultXmlManifest);
  }

  // change the config.xml
  var configAndroidPath = path.join(
    projectRoot,
    "platforms/android/app/src/main/res/xml/config.xml"
  );
  if (fs.existsSync(configAndroidPath)) {
    var configAndroidParser = new ConfigParser(configAndroidPath);

    // Original App Host
    var oldDomainUriPrefix =
      configAndroidParser.getGlobalPreference("DOMAIN_URI_PREFIX");
    if (oldDomainUriPrefix) {
      var newDomainUriPrefix = oldDomainUriPrefix.replace(
        "app_host",
        app_domain_name
      );
      configAndroidParser.setGlobalPreference(
        "DOMAIN_URI_PREFIX",
        newDomainUriPrefix
      );
    }

    // Branded App Host
    var oldDomainUriPrefixBranded = configAndroidParser.getGlobalPreference(
      "DOMAIN_URI_PREFIX_BRANDED"
    );
    if (oldDomainUriPrefixBranded) {
      if (isBrandedValid) {
        var newDomainUriPrefixBranded = oldDomainUriPrefixBranded.replace(
          "app_branded",
          app_domain_branded_name
        );
        configAndroidParser.setGlobalPreference(
          "DOMAIN_URI_PREFIX_BRANDED",
          newDomainUriPrefixBranded
        );
      } else {
        configAndroidParser.setGlobalPreference(
          "DOMAIN_URI_PREFIX_BRANDED",
          ""
        );
      }
    }

    configAndroidParser.write();
  }
};
