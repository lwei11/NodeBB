'use strict';

import * as winston from 'winston';
import * as validator from 'validator';
import * as slugify from '../slugify';

import * as meta from '../meta';

interface Request {
  path: string;
  loggedIn: boolean;
}

interface Response {
  statusCode: number;
}

interface TemplateData {
  template?: {
    topic: boolean;
  };
  category: {
    cid: string;
    name: string;
  };
  breadcrumbs?: { cid: string }[];
}

// The next line calls a function in a module that has not been updated to TS yet
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
const helpers: {
  try: (
    middleware: (req: Request, res: Response, next: () => void) => void
  ) => (req: Request, res: Response, next: () => void) => Promise<void>;
  buildBodyClass: (req: Request, res: Response, templateData?: TemplateData) => string;
} = {};

// The next line calls a function in a module that has not been updated to TS yet
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
helpers.try = function (middleware) {
  if (middleware.constructor && middleware.constructor.name === 'AsyncFunction') {
    return async function (req, res, next) {
      try {
        await middleware(req, res, next);
      } catch (err) {
        next();
      }
    };
  }
  return function (req, res, next) {
    try {
      middleware(req, res, next);
    } catch (err) {
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
    } catch (err) {
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
  } else {
    parts.push('user-guest');
  }
  return parts.join(' ');
};
