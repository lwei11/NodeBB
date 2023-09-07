'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston = __importStar(require("winston"));
const validator = __importStar(require("validator"));
const slugify = __importStar(require("../slugify"));
const meta = __importStar(require("../meta"));
// The next line calls a function in a module that has not been updated to TS yet
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
const helpers = {};
// The next line calls a function in a module that has not been updated to TS yet
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
helpers.try = function (middleware) {
    if (middleware.constructor && middleware.constructor.name === 'AsyncFunction') {
        return function (req, res, next) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield middleware(req, res, next);
                }
                catch (err) {
                    next();
                }
            });
        };
    }
    return function (req, res, next) {
        try {
            middleware(req, res, next);
        }
        catch (err) {
            next();
        }
    };
};
// The next line calls a function in a module that has not been updated to TS yet
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
helpers.buildBodyClass = function (req, res, templateData = {}) {
    const clean = req.path.replace(/^\/api/, '').replace(/^\/|\/$/g, '');
    const parts = clean.split('/').slice(0, 3);
    parts.forEach((p, index) => {
        try {
            p = slugify(decodeURIComponent(p));
        }
        catch (err) {
            winston.error(`Error decoding URI: ${p}`);
            winston.error(err.stack);
            p = '';
        }
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        p = validator.escape(String(p));
        parts[index] = index ? `${parts[0]}-${p}` : `page-${p || 'home'}`;
    });
    if (templateData.template && templateData.template.topic) {
        parts.push(`page-topic-category-${templateData.category.cid}`);
        parts.push(`page-topic-category-${slugify(templateData.category.name)}`);
    }
    if (Array.isArray(templateData.breadcrumbs)) {
        templateData.breadcrumbs.forEach((crumb) => {
            if (crumb && crumb.hasOwnProperty('cid')) {
                parts.push(`parent-category-${crumb.cid}`);
            }
        });
    }
    parts.push(`page-status-${res.statusCode}`);
    parts.push(`theme-${meta.config['theme:id'].split('-')[2]}`);
    if (req.loggedIn) {
        parts.push('user-loggedin');
    }
    else {
        parts.push('user-guest');
    }
    return parts.join(' ');
};
