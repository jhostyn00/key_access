import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import supabase from "@/lib/supabaseClient"; // Asume que tienes configurado Supabase

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        dni: { label: "DNI", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const { dni, password } = credentials;

        // Consultar el usuario en la base de datos
        const { data, error } = await supabase
          .from("persona")
          .select("*")
          .eq("dni", dni)
          .single();

        if (error || !data || data.clave !== password) {
          return null; // Si hay un error o las credenciales son incorrectas
        }

        return {
          id: data.id_persona,
          nombre: data.nombre,
          correo: data.correo,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login", // Página personalizada de login
    error: "/api/auth/error", // Ruta personalizada para los errores
  },
  session: {
    strategy: "jwt", // Usamos JWT como estrategia para manejar la sesión
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.nombre = user.nombre;
        token.correo = user.correo;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.nombre = token.nombre;
      session.user.correo = token.correo;
      return session;
    },
  },
  secret: process.env.JWT_SECRET, // Define tu clave secreta en .env
};

export default NextAuth(authOptions);
