declare module 'bcryptjs' {
  const bcrypt: {
    compare: (plain: string, hash: string) => Promise<boolean>;
    hash: (plain: string, saltRounds: number) => Promise<string>;
    genSalt: (rounds?: number) => Promise<string>;
    compareSync: (plain: string, hash: string) => boolean;
    hashSync: (plain: string, saltRounds: number) => string;
    genSaltSync: (rounds?: number) => string;
  };

  export default bcrypt;
}
