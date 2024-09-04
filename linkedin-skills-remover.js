function checkForSuccessMessage() {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            const successMessage = document.querySelector('div[data-test-artdeco-toast-item-type="success"] p.artdeco-toast-item__message');
            if (successMessage && successMessage.textContent.trim() === "Deletion was successful.") {
                clearInterval(checkInterval);
                console.log("Deletion success message detected.");
                resolve(true);
            }
        }, 1000); 

        setTimeout(() => {
            clearInterval(checkInterval);
            console.log("Timeout: Success message not found within 30 seconds.");
            resolve(false);
        }, 30000);
    });
}

function clickFirstButton() {
    let firstButton = document.querySelector("#navigation-add-edit-deeplink-edit-skills");
    if (firstButton) {
        firstButton.click();
        console.log("Button '#navigation-add-edit-deeplink-edit-skills' clicked successfully");
        setTimeout(clickDeleteSkillButton, 1000);
    } else {
        console.log("Button '#navigation-add-edit-deeplink-edit-skills' not found");
    }
}

function clickDeleteSkillButton() {
    let buttons = document.querySelectorAll('button');
    for (let button of buttons) {
        if (button.classList.contains('artdeco-button') &&
            button.classList.contains('artdeco-button--muted') &&
            button.classList.contains('artdeco-button--2') &&
            button.classList.contains('artdeco-button--tertiary') &&
            button.textContent.trim() === 'Delete skill') {
            button.click();
            console.log("'Delete skill' button clicked successfully");
            setTimeout(clickFinalDeleteButton, 1000);
            return;
        }
    }
    console.log("'Delete skill' button not found");
}

function clickFinalDeleteButton() {
    let finalDeleteButton = document.querySelector('button.artdeco-button--primary[data-test-dialog-primary-btn]');
    if (finalDeleteButton && finalDeleteButton.textContent.trim() === 'Delete') {
        finalDeleteButton.click();
        console.log("Final 'Delete' button clicked successfully");
    } else {
        console.log("Final 'Delete' button not found");
    }
}

async function runProcess() {
    clickFirstButton();
    const success = await checkForSuccessMessage();
    if (success) {
        console.log("Starting next deletion cycle...");
        setTimeout(runProcess, 1000);
    } else {
        console.log("Stopping the process due to missing success message.");
    }
}

runProcess();
