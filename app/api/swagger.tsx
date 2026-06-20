/**
 * Web-only, authentication-gated Swagger UI page served at `/api/swagger`.
 *
 * Design goals (0% runtime risk for the native app):
 *  - Swagger UI assets are loaded from a CDN at runtime via injected <script>/<link>
 *    tags. They are NEVER imported into the Metro/native bundle, so this route adds
 *    no weight or risk to the iOS/Android app.
 *  - On native platforms the page renders a short "web only" notice.
 *  - The page is only accessible to authenticated users. Unauthenticated visitors
 *    are redirected to the login screen.
 */
import React, { useEffect } from 'react';
import { Platform, Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useSelector } from 'react-redux';
import { openapiSpec } from '../../src/api/openapi';

const SWAGGER_VERSION = '5.17.14';
const SWAGGER_CSS = `https://unpkg.com/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui.css`;
const SWAGGER_JS = `https://unpkg.com/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui-bundle.js`;

function initSwagger() {
  const w = window as any;
  const el = document.getElementById('swagger-ui');
  if (!el || el.dataset.inited === 'true') return;
  if (!w.SwaggerUIBundle) return;
  el.dataset.inited = 'true';
  w.SwaggerUIBundle({
    spec: openapiSpec,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [w.SwaggerUIBundle.presets.apis],
    layout: 'BaseLayout',
  });
}

export default function SwaggerScreen() {
  const { user, isLoading } = useSelector((state: any) => state.auth);

  // Hook order must stay stable, so this effect always runs and decides
  // internally whether it should do anything.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (isLoading || !user) return;

    // Inject the stylesheet once.
    if (!document.getElementById('swagger-ui-css')) {
      const link = document.createElement('link');
      link.id = 'swagger-ui-css';
      link.rel = 'stylesheet';
      link.href = SWAGGER_CSS;
      document.head.appendChild(link);
    }

    const existing = document.getElementById('swagger-ui-js') as HTMLScriptElement | null;
    if ((window as any).SwaggerUIBundle) {
      // Script already loaded/cached.
      initSwagger();
    } else if (existing) {
      existing.addEventListener('load', initSwagger);
    } else {
      const script = document.createElement('script');
      script.id = 'swagger-ui-js';
      script.src = SWAGGER_JS;
      script.crossOrigin = 'anonymous';
      script.onload = initSwagger;
      document.body.appendChild(script);
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.center}>
        <Text style={styles.notice}>
          The API documentation is only available on the web version of HMI.
        </Text>
      </View>
    );
  }

  // Web + authenticated: Swagger UI mounts into this container.
  return React.createElement('div', {
    id: 'swagger-ui',
    style: { minHeight: '100vh', background: '#fff' },
  });
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#070b16',
  },
  notice: {
    color: '#e5e7eb',
    fontSize: 16,
    textAlign: 'center',
  },
});
