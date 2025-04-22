require('dotenv').config();
const {By, Builder, Browser, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require("assert");

describe('Selenium WebDriver Test', function() {
    this.timeout(60000);
    let driver;
    
    before(async function() {
        
        let options = new chrome.Options();

        options.addArguments([
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--start-maximized'
        ]);
        
        driver = await new Builder()
            .forBrowser(Browser.CHROME)
            .setChromeOptions(options.setPageLoadStrategy('none'))
            .build();

        await driver.manage().setTimeouts({ 
            implicit: 15000, 
            pageLoad: 30000,
            script: 15000
        });
    });

    it('Should display the correct page title', async function() {
        try {
            
            await driver.get(process.env.URL + 'login');
            
            // Esperar de forma más robusta a que la página cargue
            await driver.wait(until.titleContains('Sistema de Gestión Hospitalaria'), 20000);
            
            let title = await driver.getTitle();
            
            
            assert.equal(
                title, 
                'Sistema de Gestión Hospitalaria - SIGEH',
                'The title is not correct'
            );
        } catch (error) {
            console.error('Error in title test:', error);
            throw error;
        }
    });
    
    it('Should login successfully with valid credentials', async function() {
        try {
            
            await driver.get(process.env.URL + 'login');
            
            // Esperar a que los elementos estén presentes y visibles
            await driver.wait(until.elementLocated(By.id('email')), 20000);
            await driver.wait(until.elementIsVisible(await driver.findElement(By.id('email'))), 15000);
            await driver.wait(until.elementIsVisible(await driver.findElement(By.id('password'))), 15000);
            await driver.wait(until.elementIsVisible(await driver.findElement(By.css('button[type="submit"]'))), 15000);
            await driver.wait(until.elementIsVisible(await driver.findElement(By.css('button[type="button"]'))), 15000);
            
            const usernameField = await driver.findElement(By.id('email'));
            const passwordField = await driver.findElement(By.id('password'));
            const loginButton = await driver.findElement(By.css('button[type="submit"]'));
            const showPasswordButton = await driver.findElement(By.css('button[type="button"]'));

            await usernameField.clear();
            await usernameField.sendKeys(process.env.USERNAME);
            await passwordField.clear();
            await passwordField.sendKeys(process.env.PASSWORD);
            
            // Click the show password button when it is ready
            await showPasswordButton.click();
            await driver.sleep(1000); // Wait for the password to be shown
            await loginButton.click();
            
            // Wait to redirect
            await driver.wait(async () => {
                const currentUrl = await driver.getCurrentUrl();
                return currentUrl.startsWith(process.env.URL);
            }, 25000, 'Failed to redirect after login');
            
            const currentUrl = await driver.getCurrentUrl();
            assert(
                currentUrl.startsWith(process.env.URL),
                `Expected to be on dashboard but was on ${currentUrl}`
            );
            
            
        } catch (error) {
            console.error('Error in login test:', error);
            
            // Take screenshot for debugging
            try {
                const screenshot = await driver.takeScreenshot();
                require('fs').writeFileSync('error-screenshot.png', screenshot, 'base64');
                
            } catch (screenshotError) {
                console.error('Failed to take screenshot:', screenshotError);
            }
            
            throw error;
        }
    });

    it('It must show error message with invalid credentials', async function() {
        try {
            // Navigate to the login page
            await driver.get(process.env.URL + 'login');
            
            // Wait until the login form is loaded
            await driver.wait(until.elementLocated(By.id('email')), 15000);
            await driver.wait(until.elementLocated(By.id('password')), 15000);
            
            // Get the elements
            const usernameField = await driver.findElement(By.id('email'));
            const passwordField = await driver.findElement(By.id('password'));
            const loginButton = await driver.findElement(By.css('button[type="submit"]'));
            
            // Introduce invalid credentials
            
            await usernameField.clear();
            await usernameField.sendKeys('usuario_incorrecto@ejemplo.com');
            
            await passwordField.clear();
            await passwordField.sendKeys('contraseña_incorrecta');
            
            // Do click to send the form
            await loginButton.click();
            
            // Wait for the error message to appear
            const errorMessage = await driver.wait(until.elementLocated(By.xpath('/html/body/main/div/div/div/div/div[2]/form/div[1]/p')), 15000);
            await driver.wait(until.elementIsVisible(errorMessage), 15000);
            const errorText = await errorMessage.getText();
            
            // Check error message
            assert.equal(
                errorText, 
                'Las credenciales introducidas son incorrectas.', 
                'El mensaje de error no contiene el texto esperado'
            );
            
            // Check if the URL is still the login page
            const currentUrl = await driver.getCurrentUrl();
            assert(
                currentUrl.includes(process.env.URL + 'login'),
                'Se redirigió de la página de login con credenciales inválidas'
            );
            
        } catch (error) {
            console.error('Error during test:', error);
            
            // Take a screenshot for debugging
            try {
                const screenshot = await driver.takeScreenshot();
                require('fs').writeFileSync('error-credenciales.png', screenshot, 'base64');
                
            } catch (e) {
                console.error('Error al guardar captura:', e);
            }
            
            throw error;
        }
    });

    after(async function() {
        try {
            await driver.quit();
        } catch (error) {
            console.error('Error while closing browser:', error);
        }
    });
});
