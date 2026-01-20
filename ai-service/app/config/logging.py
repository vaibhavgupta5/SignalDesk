import logging


def configure_logging():
    logging.basicConfig(
        level=logging.DEBUG, format="%(asctime)s %(levelname)s %(name)s - %(message)s"
    )


__all__ = ["configure_logging"]
