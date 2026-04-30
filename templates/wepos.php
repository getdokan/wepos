<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <title>wePOS</title>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2.0">
    <link rel="pingback" href="<?php bloginfo('pingback_url'); ?>">
    <?php wp_head(); ?>
</head>
<body>
    <!-- React app mount point -->
    <div id="wepos-react-app" class="pui-root"></div>

    <!-- Vue.js mount point (for switching back if needed) -->
    <div id="vue-frontend-app"></div>

    <?php wepos_footer(); ?>
</body>
</html>
