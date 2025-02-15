import { test, expect } from 'playwright-test-coverage';

test('home page', async ({ page }) => {
    await page.goto('/');
    await page.getByText('The web\'s best pizza', { exact: true }).click();
    await expect(page.getByRole('button', { name: 'Order now' })).toBeVisible();
    await expect(page.getByText('Pizza is an absolute delight')).toBeVisible();
    await page.getByRole('main').getByRole('img').click();
    await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Franchise' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'History' })).toBeVisible();
    await expect(page.getByRole('heading')).toContainText('The web\'s best pizza');
})

test('not found', async ({ page }) => {
    await page.goto('http://localhost:5173/nonexistent');
    await expect(page.getByRole('heading')).toContainText('Oops');
    await expect(page.getByRole('main')).toContainText('It looks like we have dropped a pizza on the floor. Please try another page.');
})

test('about page', async ({ page }) => {
    await page.goto('/');
    await page.goto('http://localhost:5173/');
    await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
    await page.getByRole('link', { name: 'About' }).click();
    await expect(page.getByRole('main')).toContainText('The secret sauce');
    await expect(page.getByRole('main').getByRole('img').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Our employees' })).toBeVisible();
    await expect(page.locator('div').filter({ hasText: /^James$/ })).toBeVisible();
    await expect(page.locator('div').filter({ hasText: /^Maria$/ })).toBeVisible();
    await expect(page.locator('div').filter({ hasText: /^Anna$/ })).toBeVisible();
    await expect(page.locator('div').filter({ hasText: /^Brian$/ })).toBeVisible();
    await expect(page.getByRole('list')).toContainText('about');
})

test('registration, logout, login', async ({ page }) => {
    //Registration route
    await page.route('**/api/auth', async (route) => {
        const method = route.request().method();

        if (method === 'POST') {
            const registerRequest = { name: "John Cena", email: "john@test.com", password: "john" };
            const registerResponse = {
                user: {
                    name: "John Cena",
                    email: "john@test.com",
                    roles: [{ role: "diner" }],
                    id: 448
                },
                token: "abcd1234"
            };

            // Validate the request body
            expect(route.request().postDataJSON()).toMatchObject(registerRequest);

            // Fulfill with mock response
            await route.fulfill({ json: registerResponse });

        } else if (method === 'DELETE') {
            const logoutResponse = { message: "logout successful" };

            // Fulfill logout response
            await route.fulfill({ json: logoutResponse });

        } else {
            // Pass through other methods (optional)
            await route.continue();
        }
    });


    await page.goto('/');
    await page.getByRole('link', { name: 'Register' }).click();
    await page.getByRole('textbox', { name: 'Full name' }).fill('John Cena');
    await page.getByRole('textbox', { name: 'Email address' }).fill('john@test.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('john');
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page.getByText('The web\'s best pizza', { exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'JC' }).click();
    await expect(page.getByRole('main')).toContainText('John Cena');
    await expect(page.getByRole('main')).toContainText('john@test.com');
    await expect(page.getByRole('main')).toContainText('diner');
    await page.getByRole('link', { name: 'Logout' }).click();
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
})

test('purchase with login', async ({ page }) => {
    await page.route('*/**/api/order/menu', async (route) => {
        const menuRes = [
            { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
            { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
        ];
        expect(route.request().method()).toBe('GET');
        await route.fulfill({ json: menuRes });
    });

    await page.route('*/**/api/franchise', async (route) => {
        const franchiseRes = [
            {
                id: 2,
                name: 'LotaPizza',
                stores: [
                    { id: 4, name: 'Lehi' },
                    { id: 5, name: 'Springville' },
                    { id: 6, name: 'American Fork' },
                ],
            },
            { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
            { id: 4, name: 'topSpot', stores: [] },
        ];
        expect(route.request().method()).toBe('GET');
        await route.fulfill({ json: franchiseRes });
    });

    await page.route('*/**/api/auth', async (route) => {
        const loginReq = { email: 'd@jwt.com', password: 'a' };
        const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
        expect(route.request().method()).toBe('PUT');
        expect(route.request().postDataJSON()).toMatchObject(loginReq);
        await route.fulfill({ json: loginRes });
    });

    await page.route('*/**/api/order', async (route) => {
        const orderReq = {
            items: [
                { menuId: 1, description: 'Veggie', price: 0.0038 },
                { menuId: 2, description: 'Pepperoni', price: 0.0042 },
            ],
            storeId: '4',
            franchiseId: 2,
        };
        const orderRes = {
            order: {
                items: [
                    { menuId: 1, description: 'Veggie', price: 0.0038 },
                    { menuId: 2, description: 'Pepperoni', price: 0.0042 },
                ],
                storeId: '4',
                franchiseId: 2,
                id: 23,
            },
            jwt: 'eyJpYXQ',
        };
        expect(route.request().method()).toBe('POST');
        expect(route.request().postDataJSON()).toMatchObject(orderReq);
        await route.fulfill({ json: orderRes });
    });

    await page.goto('/');

    // Go to order page
    await page.getByRole('button', { name: 'Order now' }).click();

    // Create order
    await expect(page.locator('h2')).toContainText('Awesome is a click away');
    await page.getByRole('combobox').selectOption('4');
    await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
    await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
    await expect(page.locator('form')).toContainText('Selected pizzas: 2');
    await page.getByRole('button', { name: 'Checkout' }).click();

    // Login
    await page.getByPlaceholder('Email address').click();
    await page.getByPlaceholder('Email address').fill('d@jwt.com');
    await page.getByPlaceholder('Email address').press('Tab');
    await page.getByPlaceholder('Password').fill('a');
    await page.getByRole('button', { name: 'Login' }).click();

    // Pay
    await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
    await expect(page.locator('tbody')).toContainText('Veggie');
    await expect(page.locator('tbody')).toContainText('Pepperoni');
    await expect(page.locator('tfoot')).toContainText('0.008 ₿');
    await page.getByRole('button', { name: 'Pay now' }).click();

    // Check balance
    await expect(page.getByText('0.008')).toBeVisible();
});