/*
 * Melampus
 */
// initialize the MP namespace
if (typeof MP == "undefined") 
{
    MP = {};
}

MP.main = 
{
    
    // default trigger for the popup 
    xlateTrigger: "mousemove",

    // flag status of ctrl key 
    ctrlDown: false,
    
    init: function() 
    {
		window.addEventListener("load", this.onLoad, false);
       
	},
    
    shutdown: function() 
    {
          MP.util.shutdown();
    },
	
	onLoad: function() 
    {
        MP.util.init();
        // TODO - register onUnload handler 
        // this came from the peraperakun code, but it's causing
        // an error.  Revisit this to figure out what we should be doing.
        //window.addEventListener("unload", this.onUnload, false);
        
        var mks = document.getElementById("mainKeyset");

        // TODO do we want to make the accelarators and short cut keys 
        // configurable in the preferences dialgo as peraperakun does?  

        var names = ["toggle"];

        for (var i = 0; i<names.length; i++) 
        {
            var name = names[i];
            var keychar = MP.util.getPref("keys." + name);
            var mod = MP.util.getPref("keymodifiers." + name);
            if (keychar.length > 0) 
            {
                var key = document.createElementNS(
                        "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "key");
                key.setAttribute("id", "melampus-" + name + "-key");
                key.setAttribute("key", (keychar.length > 1) ? "" : keychar);
                key.setAttribute("keycode", (keychar.length > 1) ? ("VK_" + keychar) : "");           
                key.setAttribute("modifiers", mod);
                key.setAttribute("command", "melampus-" + name + "-cmd");
                mks.appendChild(key);
            }
        }
        // TODO if we add a visual indication of the melampus enabled/disabled 
        // status we need to register the onTabSelect handler on the browser 
        // to update it accordingly when the user switches tabs.
        //gBrowser.mTabContainer.addEventListener("select", this.onTabSelect, false);
	},
	
	onUnLoad: function() 
    {
        //gBrowser.mTabContainer.removeEventListener("select", this.onTabSelect, false);
        this.shutdown();
	},
	
	onTabSelect: function() 
    {
      //TODO - when we add a visual indication of the extension status
      // we'll need to update it upon tab select
    },
    
    mp_inlineToggle: function() 
    {

        // Thunderbird has no tabs, so we need to use the window instead of
        // the current browser container
        var bro = this.getCurrentBrowser();
        if (bro.melampus) this.inlineDisable(bro);
            else this.inlineEnable(bro);
            
        this.onTabSelect();
    },
    
    inlineEnable: function(bro) 
    {
        bro.melampus = {};
        this.mouseButtons = 0;
        this.xlateTrigger = MP.util.getPref("popuptrigger"); 
        bro.addEventListener(this.xlateTrigger, this.doXlateText, false);
        //bro.addEventListener("mousedown", this.onMouseDown, false);
        //bro.addEventListener("mouseup", this.onMouseUp, false);
        bro.addEventListener("keydown", this.onKeyDown, true);
        bro.addEventListener("keyup", this.onKeyUp, true);
        this.setLanguage(MP.util.getPref("language"));
        this.setStatus("Ready");
    },
    
    inlineDisable: function(bro) 
    {
        bro.removeEventListener(this.xlateTrigger,this.doXlateText,false);
        //bro.removeEventListener("mousedown", this.onMouseDown, false);
        //bro.removeEventListener("mouseup", this.onMouseUp, false);
        bro.removeEventListener("keydown", this.onKeyDown, true);
        bro.removeEventListener("keyup", this.onKeyUp, true);
        //bro.removeEventListener("unload", this.onTabClose, true);

        var e;
        e = bro.contentDocument.getElementById("melampus-css");
        if (e) e.parentNode.removeChild(e);
        e = bro.contentDocument.getElementById("melampus-xml-css");
        if (e) e.parentNode.removeChild(e);
        e = bro.contentDocument.getElementById("mp-window");
        if (e) e.parentNode.removeChild(e);

        delete bro.melampus;

        MP.xlate.hideDeclensionTable()
        this.setStatus("Disabled");
    },

    // this would be called from a popup-menu item
    setLanguage: function(lang) {
        
        var supported = "Supported Languages: ";
        for (var lt in MP.Languages) {
            //supported = supported + "," + lt;
            if (MP.Languages[lt].implementsMPLanguageTool &&
                ! (MP.Languages[lt].prototype instanceof MP.LanguageTool)) 
            {
                // Set MP.LanguageTool as the prototype here
                // if the langage is defined in a separate extension
                // the MP.LanguageTool prototype won't be in the same
                // scope across extensions. We'd need to implement
                // an XPCOM singleton or use JS Modules in FF3 
                // to enable that.
                //MP.Languages[lt].prototype = new MP.LanguageTool();
            }
            if (MP.Languages[lt].prototype instanceof MP.LanguageTool 
                || MP.Languages[lt].implementsMPLanguageTool) {
                supported = supported + "," + lt;
            }
        }
        alert(supported);
        if (    MP.Languages[lang] && 
                (MP.Languages[lang].prototype instanceof MP.LanguageTool
                  || MP.Languages[lang].implementsMPLanguageTool)) 
        {
            MP.main.currentLanguageTool = 
               new MP.Languages[lang]();
        } 
        else
        {
            alert("language " + lang + "not supported");
            this.inlineDisable();
        }
    },
    
    getLanguageTools: function() {
        // need to verify that this allows multiple tabs to have
        // different languages
        return MP.main.currentLanguageTool;  
    },
    
    setStatus: function(s) 
    {
        window.status = "[melampus] " + s;
    },
    
    getTrigger: function() 
    {
      return this.xlateTrigger;  
    },
    
    getCurrentBrowser: function() 
    {
        if (this.is_tbird) {
            var b = document.getElementById("messagepane");
            if (b) return b;
            return document.getElementById("content-frame");    // compose
        }
        else {
            return gBrowser.mCurrentBrowser;
        }
    },
    
    doXlateText: function(e) 
    {
        /* TODO should we disable the double click handler if the 
         * the selected text was a link?
         */
        //if (this.xlateTrigger == 'dblclick' && e.srcElement.tagName == "A") {
        //    return true;
        //}
    
        // disable the mousemove handler if the ctrl key 
        // is currently pressed 
        // (i.e. to enable mouse movement into the popup to click a link)
        if ( MP.main.xlateTrigger == 'mousemove' && MP.main.ctrlDown) {
            return true;
        }
       
        MP.xlate.doMouseMoveOverText(e);
    },
        
    /*
     * handler for key presses:
     * shift (keyCode==16) : show/refresh the declension table popup
     * ctrl (keyCode==17) : sets flag to temporarily disable
     *                      the mousemove handler
     */
    onKeyDown: function(e) 
    {
        // shift key handler
        // only effective while the mouseover popup is visible
        if (e.keyCode == 16) 
        {
            MP.main.getLanguageTools().handleShiftTool(e);
        }
        else if (e.keyCode == 17) {
            MP.main.ctrlDown = true;
        }
        // return true to allow event propogation if needed
        return true;
    },
    
    /*
     * KeyUp handler
     */
    onKeyUp: function(e) 
    {
        // reset the status of the ctrlDown flag
        // to reenable the mousemove handler
        if (e.keyCode == 17) 
        { 
            MP.main.ctrlDown = false;
        }
    }

};

MP.main.init();


