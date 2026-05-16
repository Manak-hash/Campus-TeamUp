<?php

use Slim\App;

return function (App $app) {
    $app->addBodyParsingMiddleware();
    $app->addRoutingMiddleware();

    // Error handling (should be added last)
    $displayErrorDetails = ($_ENV['APP_DEBUG'] ?? 'false') === 'true';
    $errorMiddleware = $app->addErrorMiddleware(
        $displayErrorDetails,
        true,
        true
    );
};
