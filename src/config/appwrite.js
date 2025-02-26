import { Client, Databases } from 'appwrite'

const client = new Client()
    .setEndpoint('YOUR_ENDPOINT')
    .setProject('YOUR_PROJECT_ID')

export const databases = new Databases(client) 