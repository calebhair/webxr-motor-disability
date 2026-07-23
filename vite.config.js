import basicSsl from '@vitejs/plugin-basic-ssl'

export default {
    plugins: [
        basicSsl({
            /** name of certification */
            name: 'vrtest',
            /** optional, days before certificate expires */
            ttlDays: 90,
            /** custom certification directory */
            certDir: './',
        }),
    ],
}