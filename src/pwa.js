import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
    onNeedRefresh() {
        // Show a prompt to user to refresh, or just auto refresh
        // For this demo, we can just log it
        console.log('New content available, click on reload button to update.')
    },
    onOfflineReady() {
        console.log('App is ready to work offline.')
    },
})
