// File: /frontend/help/help-data.js

export const universeTours = {
    // ---------------------------------------------------------
    // THE MASTER TAO TOUR
    // ---------------------------------------------------------
    'TAO': [
        {
            targetId: "left-orb",
            message: "This is the Left Drawer. It houses your Communications. Tap LEFT to open it.",
            expectedEvent: "click",       
            expectedId: "left-orb"        
        },
        {
            targetId: "header-menu-btn",
            message: "This is the Global System Menu for file-level commands. Tap the 3 solid lines to open it.",
            expectedEvent: "click",       
            expectedId: "header-menu-btn" 
        },
        {
            targetId: "center-orb-container", 
            message: "I am TAO. Double-tap me to OPEN the Chatbox interface.",
            expectedEvent: "dblclick",
            expectedId: "center-orb-container"
        },
        {
            targetId: "center-orb-container",
            message: "Notice the chatbox stays open in the background. Double-tap me again to HIDE it.",
            expectedEvent: "dblclick",
            expectedId: "center-orb-container"
        },
        {
            targetId: "right-orb",
            message: "This is the Right Drawer. Your Health modules live here. Tap RIGHT to open it.",
            expectedEvent: "click",       
            expectedId: "right-orb"       
        },
        {
            targetId: "logoff-orb",
            message: "Tap OFF to end your session. The tour is complete.",
            expectedEvent: "end_tour",    
            expectedId: "logoff-orb"
        }
    ]
};