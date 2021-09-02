export class Permission {
    static FREE: Permission = {
        name: "free",
        permLevel: 0,
        pageCount: 0
    };

    static BASIC: Permission = {
        name: "basic",
        permLevel: 1,
        pageCount: 1
    };

    static PRO: Permission = {
        name: "pro",
        permLevel: 2,
        pageCount: 5
    };

    static BUSINESS: Permission = {
        name: "business",
        permLevel: 3,
        pageCount: 15
    };

    static BUSINESS2: Permission = {
        name: "business2",
        permLevel: 4,
        pageCount: 25
    };

    static BUSINESS3: Permission = {
        name: "business3",
        permLevel: 5,
        pageCount: 50
    };

    static BUSINESS4: Permission = {
        name: "business4",
        permLevel: 6,
        pageCount: 100
    };

    static GODMODE: Permission = {
        name: "godmode",
        permLevel: 30,
        pageCount: Infinity
    };

    static ADMIN: Permission = {
        name: "admin",
        permLevel: 999,
        pageCount: Infinity
    };

    name: string = 'free';
    permLevel: number = 0;
    pageCount: number = 0;

    static parse(s: string): Permission {
        switch (s) {
            case "basic":
                return Permission.BASIC;
            case "pro":
                return Permission.PRO;
            case "business":
                return Permission.BUSINESS;
            case "business2":
                return Permission.BUSINESS2;
            case "business3":
                return Permission.BUSINESS3;
            case "business4":
                return Permission.BUSINESS4;
            case "godmode":
                return Permission.GODMODE;
            case "admin":
                return Permission.ADMIN;
            default:
                return Permission.FREE;
        }
    }
}
