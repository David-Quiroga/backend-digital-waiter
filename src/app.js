// Importar módulos necesarios
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const exphbs = require('express-handlebars');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const MySQLStore = require('express-mysql-session')(session);
const bodyparser = require('body-parser');
const fileUpload = require("express-fileupload");
const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const { minify } = require('html-minifier-terser');
const winston = require('winston');
const cors = require('cors')
const { Loader } = require('@googlemaps/js-api-loader')

// Importar módulos locales
const { MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE, MYSQLPORT } = require('./keys');
require('./lib/passport');

// Crear aplicación Express
const app = express();

// Configurar helmet y Content Security Policy
// app.use(helmet({
//     contentSecurityPolicy: {
//         directives: {
//             ...helmet.contentSecurityPolicy.getDefaultDirectives(),
//             "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://maps.googleapis.com"],
//             "img-src": ["'self'", "data:", "blob:", "http://localhost:4200", "https://maps.gstatic.com", "https://*.googleapis.com"],
//             "frame-src": ["'self'", "blob:", "https://www.google.com"],
//             "connect-src": ["'self'", "http://localhost:4200", "https://maps.googleapis.com"],
//             "object-src": ["'none'"],
//             "default-src": ["'self'"]
//         }
//     },
// }));

// Configurar almacenamiento de sesiones MySQL
const mysqlOptions = {
    host: MYSQLHOST,
    port: MYSQLPORT,
    user: MYSQLUSER,
    password: MYSQLPASSWORD,
    database: MYSQLDATABASE,
    createDatabaseTable: true
};
const sessionStore = new MySQLStore(mysqlOptions);

app.use(session({
    store: sessionStore,
    secret: "SESSION_SECRET",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'Strict'
    }
}));


// Configurar motor de vistas
app.set('port', process.env.PORT || 4200);

// Configurar middleware
app.use(cookieParser());
app.use(fileUpload({ createParentPath: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '300mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Middleware de seguridad y rendimiento
app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));
app.use(compression());

// Middleware para minificar HTML
app.use(async (req, res, next) => {
    const originalSend = res.send.bind(res);
    res.send = async function (body) {
        if (typeof body === 'string') {
            try {
                body = await minify(body, {
                    removeComments: true,
                    collapseWhitespace: true,
                    minifyCSS: true,
                    minifyJS: true,
                });
            } catch (err) {
                console.error('Error minifying HTML:', err);
            }
        }
        return originalSend(body);
    };
    next();
});


app.use((req, res, next) => {
    app.locals.message = req.flash('message');
    app.locals.success = req.flash('success');
    app.locals.user = req.user || null;
    next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/src/public', express.static(path.join(__dirname, 'src/public')));

// Asegúrate de que esto cubre tus imágenes
app.use('/img/usuario', express.static(path.join(__dirname, 'public/img/usuario')));

// Configurar sistema de logging
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}
app.use(cors({
    origin: 'http://localhost:8080' // Cambia esto al origen de tu aplicación Vue
  }));


app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Importar y usar las rutas
const restauranteRouter = require('./router/restauranteRouter');
const employeeRouter = require('./router/employeeRouter')
const metodosRouter = require('./router/metodosRouter');
const inventarioRouter = require('./router/inventarioRouter');
const userRouter = require('./router/usuarioRouter')
const proveedoresRouter = require('./router/proveedoresRouter');
const sopasRouter = require('./router/sopasRouter')
const heladitosRouter = require('./router/heladoRouter')
const entradasRouter = require('./router/entradasRouter')
const bebidasRouter = require('./router/bebidasRouter')
//! Es el de helados
//const visualizarRouter = require('./router/visualizarRouter')

app.use('/restaurante', restauranteRouter)
app.use('/empleado', employeeRouter)
app.use('/metodos', metodosRouter)
app.use('/inventario', inventarioRouter)
app.use('/usuario', userRouter)
app.use('/proveedores', proveedoresRouter)
app.use('/sopas', sopasRouter)
app.use('/helados', heladitosRouter)
app.use('/entrada', entradasRouter)
app.use('/bebidas', bebidasRouter)
//! Es el de helados
//app.use('/data', visualizarRouter)
//app.use('/usuario', userRouter)

//app.use('/restaurante', restauranteRouter); 


// Exportar la aplicación
module.exports = app;