import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
    name: 'productImages',
    access: (allow) => ({
        'products/*': [
            allow.guest.to(['read']),
            allow.authenticated.to(['read']),
            allow.groups(['ADMINS']).to(['read', 'write', 'delete']),
        ],
    }),
});
