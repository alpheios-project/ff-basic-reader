/*
 * Melampus utility functions 
 */
const ConsoleService = 
    Components.classes["@mozilla.org/consoleservice;1"]
    .getService(Components.interfaces.nsIConsoleService);
    
const prefs = 
     Components.classes["@mozilla.org/preferences-service;1"]
    .getService(Components.interfaces.nsIPrefService)
    .getBranch("extensions.melampus.");
    
const nsIPrefBranch = Components.interfaces.nsIPrefBranch;

const logPrefix = "melampus:";

/*
 * utility functions are encaspulated in the MP.util object 
 * namespace
 */
// Make sure the MP namespace is defined
if (typeof MP == "undefined") {
    MP = {};
}

MP.util = {

    init: function() {
        prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
        prefs.addObserver("", this, false);
    },
    
    shutdown: function()
    {        
        prefs.removeObserver("", this);
    },
    
    /*
     * Observer changes to the preferences in the extensions.melampus branch
     */
    observe: function(subject, topic, data)
    {
        if (topic != "nsPref:changed") {
            return;
        }
        var name = data;
        var value = this.getPref(name);
        this.updatePref(name, value);
    },

    updatePref: function(name, value) {
        /*
         * TODO - implement interface response to configuration changes
         */
        
    },

    /*
     * helper function to get an XPCOM component class
     */
    CC: function(className) 
    {
        return Components.classes[className];
    },

    /*
     * helper function to get an XPCOM component interface
     */
    CI: function(ifaceName)
    {
        return Components.interfaces[ifaceName];
    },

    /*
     * Log a string message to the javascript console.
     * Only logs the message if the extensions.melampus.debug 
     * preference is enabled
     */
    log: function(msg) {
        var isDebug = this.getPref("debug");
        if (! isDebug ) {
            return;
        }
        ConsoleService.logStringMessage(logPrefix + msg);
    },
    
    /*
     * Get a preference from the extensions.melampus branch
     */
    getPref: function(name)
    {

        var type = prefs.getPrefType(name);
        if (type == nsIPrefBranch.PREF_STRING)
            return prefs.getCharPref(name);
        else if (type == nsIPrefBranch.PREF_INT)
            return prefs.getIntPref(name);
        else if (type == nsIPrefBranch.PREF_BOOL)
            return prefs.getBoolPref(name);
    },
    
    /*
     * Set a preference in the extensions.melampus branch
     */
    setPref: function(name, value)
    {
        var type = prefs.getPrefType(name);
        
        if (type == nsIPrefBranch.PREF_STRING)
            prefs.setCharPref(name, value);
        else if (type == nsIPrefBranch.PREF_INT)
            prefs.setIntPref(name, value);
        else if (type == nsIPrefBranch.PREF_BOOL)
            prefs.setBoolPref(name, value);
    }
};
